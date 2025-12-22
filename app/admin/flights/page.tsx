import { redirect } from 'next/navigation';

export default function AdminFlightsPage() {
  // Redirect all access to flights admin to trains admin
  redirect('/admin/trains');
}
