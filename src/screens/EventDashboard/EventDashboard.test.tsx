import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import EventDashboard from './EventDashboard';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { MockedProvider } from '@apollo/react-testing';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { I18nextProvider } from 'react-i18next';
import i18nForTest from 'utils/i18nForTest';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { type DefaultOptions } from '@apollo/client';
import {
  queryMockWithTime,
  queryMockWithoutTime,
} from './EventDashboard.mocks';

// We want to disable all forms of caching so that we do not need to define a custom merge function in testing for the network requests
const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
};

// Mock the modules for PieChart rendering as they require a trasformer being used (which is not done by Jest)
// These modules are used by the Feedback components
jest.mock('@mui/x-charts/PieChart', () => ({
  pieArcLabelClasses: jest.fn(),
  PieChart: jest.fn().mockImplementation(() => <>Test</>),
  pieArcClasses: jest.fn(),
}));

// We will wait for 500 ms after each test to ensure that the queries and rendering of the nested components such as `Feedback` and `Statistics` is complete before moving on to the next test suite
// This is important to mitigate the cleanup errors due to nesting of components
async function wait(ms = 500): Promise<void> {
  await act(() => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  });
}
let mockID: string | undefined = 'event123';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ eventId: mockID }),
}));

describe('Testing Event Dashboard Screen', () => {
  test('The page should display event details correctly and also show the time if provided', async () => {
    const { queryByText, queryAllByText } = render(
      <BrowserRouter>
        <MockedProvider
          addTypename={false}
          mocks={queryMockWithTime}
          defaultOptions={defaultOptions}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <I18nextProvider i18n={i18nForTest}>
              <ToastContainer />
              <EventDashboard />
            </I18nextProvider>
          </LocalizationProvider>
        </MockedProvider>
      </BrowserRouter>,
    );

    await waitFor(() => expect(queryAllByText('Event Title').length).toBe(2));

    await waitFor(() =>
      expect(queryAllByText('Event Description').length).toBe(2),
    );

    await waitFor(() => expect(queryByText('India')).toBeInTheDocument());

    await wait();
  });

  test('The page should display event details correctly and should not show the time if it is null', async () => {
    const { queryAllByText } = render(
      <BrowserRouter>
        <MockedProvider
          addTypename={false}
          mocks={queryMockWithoutTime}
          defaultOptions={defaultOptions}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ToastContainer />
            <EventDashboard />
          </LocalizationProvider>
        </MockedProvider>
      </BrowserRouter>,
    );

    await waitFor(() => expect(queryAllByText('Event Title').length).toBe(2));

    await wait();
  });
  test('should be redirected to /orglist if eventId is undefined', async () => {
    mockID = undefined;
    render(
      <BrowserRouter>
        <MockedProvider
          addTypename={false}
          mocks={queryMockWithTime}
          defaultOptions={defaultOptions}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ToastContainer />
            <EventDashboard />
          </LocalizationProvider>
        </MockedProvider>
      </BrowserRouter>,
    );
    await wait(100);
    expect(window.location.pathname).toEqual('/orglist');
  });
});
