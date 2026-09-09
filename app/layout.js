import ThemeRegistry from './ThemeRegistry';
import './globals.css';

export const metadata = {
  title: 'FM AMC Maintenance',
  description: 'Seven Spikes FM AMC inspection checklists',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
