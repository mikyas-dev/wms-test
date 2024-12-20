import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

enum TransactionType {
  PUTAWAY = 'PUTAWAY',
  REMOVE = 'REMOVE',
  MOVE = 'MOVE',
}
import { NextRequest, NextResponse } from "next/server";

// Types for query parameters
type FilterParams = {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  status?: 'COMPLETED' | 'UNDONE';
  locationId?: string;
  itemId?: string;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    
    // Extract filter parameters
    const filters: FilterParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      type: searchParams.get('type') as TransactionType || undefined,
      status: searchParams.get('status') as 'COMPLETED' | 'UNDONE' || undefined,
      locationId: searchParams.get('locationId') || undefined,
      itemId: searchParams.get('itemId') || undefined,
    };

    // Build where clause based on filters
    const where = {
      AND: [
        // Date range filter
        filters.startDate && {
          createdAt: {
            gte: new Date(filters.startDate),
          },
        },
        filters.endDate && {
          createdAt: {
            lte: new Date(filters.endDate),
          },
        },
        // Transaction type filter
        filters.type && {
          type: filters.type,
        },
        // Status filter
        filters.status && {
          status: filters.status,
        },
        // Location filter (either from or to location)
        filters.locationId && {
          OR: [
            { fromLocationId: filters.locationId },
            { toLocationId: filters.locationId },
          ],
        },
        // Item filter
        filters.itemId && {
          itemId: filters.itemId,
        },
      ].filter(Boolean),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        item: {
          select: {
            sku: true,
            name: true,
            barcode: true,
          },
        },
        fromLocation: {
          select: {
            label: true,
          },
        },
        toLocation: {
          select: {
            label: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
        undoneBy: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();

    // 1. Get the transaction with related data
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        item: true,
        fromLocation: true,
        toLocation: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // 2. Validate if transaction can be undone
    if (transaction.status === 'UNDONE') {
      return NextResponse.json(
        { error: 'Transaction already undone' },
        { status: 400 }
      );
    }

    // Check if this is the most recent COMPLETED transaction for this item
    const moreRecentTransaction = await prisma.transaction.findFirst({
        where: {
          itemId: transaction.itemId,
          createdAt: {
            gt: transaction.createdAt,
          },
          status: 'COMPLETED',
        },
      });
  
      if (moreRecentTransaction) {
        return NextResponse.json(
          { error: 'Can only undo the most recent transaction for an item' },
          { status: 400 }
        );
      }

    // 3. Validate stock levels for undo operation
    let canUndo = true;
    let errorMessage = '';

    // Check stock levels based on transaction type
    if (transaction.type === 'MOVE' || transaction.type === 'PUTAWAY') {
      // Need to check if there's enough stock at destination to remove
      console.log(transaction.type, transaction.itemId, transaction.toLocationId)
      const destinationStock = await prisma.stock.findUnique({
        where: {
          itemId_locationId: {
            itemId: transaction.itemId,
            locationId: transaction.toLocationId!,
          },
        },
      });
      
      if (!destinationStock || destinationStock.quantity < transaction.quantity) {
        console.log(destinationStock.quantity, transaction.quantity)
        canUndo = false;
        errorMessage = 'Insufficient stock at destination location';
      }
    }

    if (!canUndo) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // 4. Perform undo operation in a transaction
    interface StockUpdateArgs {
        where: {
            itemId_locationId: {
                itemId: string;
                locationId: string;
            };
        };
        data: {
            quantity: {
                decrement: number;
            };
        };
    }

    interface StockUpsertArgs {
        where: {
            itemId_locationId: {
                itemId: string;
                locationId: string;
            };
        };
        create: {
            itemId: string;
            locationId: string;
            quantity: number;
        };
        update: {
            quantity: {
                increment: number;
            };
        };
    }

    interface TransactionUpdateArgs {
        where: {
            id: string;
        };
        data: {
            status: 'UNDONE';
            undoneAt: Date;
            undoneById: string;
        };
        include: {
            item: {
                select: {
                    sku: boolean;
                    name: boolean;
                };
            };
            fromLocation: {
                select: {
                    label: boolean;
                };
            };
            toLocation: {
                select: {
                    label: boolean;
                };
            };
            user: {
                select: {
                    username: boolean;
                };
            };
            undoneBy: {
                select: {
                    username: boolean;
                };
            };
        };
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update stock levels based on transaction type
        switch (transaction.type) {
            case 'PUTAWAY':
                // Remove stock from destination
                const stockUpdateArgs: StockUpdateArgs = {
                    where: {
                        itemId_locationId: {
                            itemId: transaction.itemId,
                            locationId: transaction.toLocationId!,
                        },
                    },
                    data: {
                        quantity: {
                            decrement: transaction.quantity,
                        },
                    },
                };
                await tx.stock.update(stockUpdateArgs);
                break;

            case 'REMOVE':
                // Add stock back to source
                const stockUpsertArgs: StockUpsertArgs = {
                    where: {
                        itemId_locationId: {
                            itemId: transaction.itemId,
                            locationId: transaction.fromLocationId!,
                        },
                    },
                    create: {
                        itemId: transaction.itemId,
                        locationId: transaction.fromLocationId!,
                        quantity: transaction.quantity,
                    },
                    update: {
                        quantity: {
                            increment: transaction.quantity,
                        },
                    },
                };
                await tx.stock.upsert(stockUpsertArgs);
                break;

            case 'MOVE':
                // Remove from destination and add back to source
                const stockUpdateArgsMove: StockUpdateArgs = {
                    where: {
                        itemId_locationId: {
                            itemId: transaction.itemId,
                            locationId: transaction.toLocationId!,
                        },
                    },
                    data: {
                        quantity: {
                            decrement: transaction.quantity,
                        },
                    },
                };
                await tx.stock.update(stockUpdateArgsMove);

                const stockUpsertArgsMove: StockUpsertArgs = {
                    where: {
                        itemId_locationId: {
                            itemId: transaction.itemId,
                            locationId: transaction.fromLocationId!,
                        },
                    },
                    create: {
                        itemId: transaction.itemId,
                        locationId: transaction.fromLocationId!,
                        quantity: transaction.quantity,
                    },
                    update: {
                        quantity: {
                            increment: transaction.quantity,
                        },
                    },
                };
                await tx.stock.upsert(stockUpsertArgsMove);
                break;
        }

        // Mark transaction as undone
        const transactionUpdateArgs: TransactionUpdateArgs = {
            where: { id: transactionId },
            data: {
                status: 'UNDONE',
                undoneAt: new Date(),
                // TODO: Get actual user ID from session
                undoneById: transaction.userId,
            },
            include: {
                item: {
                    select: {
                        sku: true,
                        name: true,
                    },
                },
                fromLocation: {
                    select: {
                        label: true,
                    },
                },
                toLocation: {
                    select: {
                        label: true,
                    },
                },
                user: {
                    select: {
                        username: true,
                    },
                },
                undoneBy: {
                    select: {
                        username: true,
                    },
                },
            },
        };
        const updatedTransaction = await tx.transaction.update(transactionUpdateArgs);

        return updatedTransaction;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to undo transaction:', error);
    return NextResponse.json(
      { error: 'Failed to undo transaction' },
      { status: 500 }
    );
  }
}