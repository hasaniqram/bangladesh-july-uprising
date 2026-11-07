import { render, screen } from '@testing-library/react';
import App from './App';

// Keep the application smoke test focused on wiring rather than rendering
// the large geographic dataset in JSDOM.
vi.mock('./components/BangladeshMap', () => ({
  default: function MockUprisingMap() {
    return <main data-testid="uprising-map">Bangladesh Uprising Memorial Map</main>;
  },
}));

test('renders the uprising memorial application', () => {
  render(<App />);
  expect(screen.getByTestId('uprising-map')).toBeInTheDocument();
  expect(screen.getByText('Bangladesh Uprising Memorial Map')).toBeInTheDocument();
});
