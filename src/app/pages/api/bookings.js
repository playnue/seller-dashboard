// pages/api/bookings.js
import { nhost } from '../../lib/nhost'; // Adjust the path based on your project structure

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the seller ID from the session
    const { session } = await nhost.auth.getSession();
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const sellerId = session.user.id;

    // Fetch bookings for the seller's venues
    // You might need to adjust this query based on your database schema
    const { data, error } = await nhost.graphql.request(`
      query GetSellerBookings {
        bookings(
          where: { 
            venue: { 
              owner_id: { _eq: "${sellerId}" } 
            }
          },
          order_by: { created_at: desc }
        ) {
          id
          user {
            id
            displayName
          }
          court_name
          venue_name
          payment_type
          slot {
            date
            start_at
            end_at
            price
          }
        }
      }
    `);

    if (error) {
      console.error('GraphQL error:', error);
      return res.status(500).json({ message: 'Error fetching bookings', error });
    }

    return res.status(200).json({ bookings: data.bookings });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}