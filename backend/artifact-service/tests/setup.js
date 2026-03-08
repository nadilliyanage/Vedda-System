// Suppress console output during tests.
// Controllers log expected errors (e.g. 500 paths) and mongoose logs
// disconnection events — these are noise, not failures.
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
