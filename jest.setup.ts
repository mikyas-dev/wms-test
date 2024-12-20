import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocks
fetchMock.enableMocks();

// Mock global Response if needed
global.Response = require('node-fetch').Response;