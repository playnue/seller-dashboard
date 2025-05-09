"use client";
import { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Users,
  Star,
  Activity,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAccessToken, useUserData } from "@nhost/nextjs";
import RecentBookingsCard from "./RecentBookingsCard"

export default function HomeContent() {
  const user = useUserData();
  const accessToken = useAccessToken();
  const [bookings, setTurfBookings] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [sportDistribution, setSportDistribution] = useState([]);
  // New state variables for the metrics
  const [todayBookings, setTodayBookings] = useState({ count: 0, change: 0, comparison: "vs last week" });
  const [weeklyRevenue, setWeeklyRevenue] = useState({ weekly: 0, change: 0, currency: "₹" });
  const [utilizationRate, setUtilizationRate] = useState(0);
  const [popularTimeSlots, setPopularTimeSlots] = useState([]);

  const calculateSportsDistribution = (venues) => {
    // Create a counter for each sport
    const sportsCounter = {};
    
    // Loop through venues and count sports
    venues.forEach(venue => {
      if (venue.sports && Array.isArray(venue.sports)) {
        venue.sports.forEach(sport => {
          if (sportsCounter[sport]) {
            sportsCounter[sport]++;
          } else {
            sportsCounter[sport] = 1;
          }
        });
      }
    });
    
    // Calculate total count
    const totalCount = Object.values(sportsCounter).reduce((sum, count) => sum + count, 0);
    
    // Convert to percentage and format for display
    const distribution = Object.entries(sportsCounter).map(([name, count]) => {
      return {
        name,
        value: Math.round((count / totalCount) * 100)
      };
    });
    
    // Sort by value (highest first)
    distribution.sort((a, b) => b.value - a.value);
    
    // Apply colors
    const colors = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c", "#ffc658"];
    const distributionWithColors = distribution.map((item, index) => {
      return { ...item, color: colors[index % colors.length] };
    });
    
    setSportDistribution(distributionWithColors);
  };
  const fetchTurfBookings = async (userId) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Hasura-Role": "seller",
        },
        body: JSON.stringify({
          query: `
                query GetSellerBookings($userId: uuid!) {
                  venues(where: { user_id: { _eq: $userId } }) {
                    id
                    title
                    sports
                    courts {
                      id
                      name
                      slots {
                        id
                        date
                        start_at
                        end_at
                        price
                        bookings {
                          id
                          created_at
                          payment_type
                          user_id
                          user {
                            id
                            displayName
                            email
                          }
                        }
                      }
                    }
                  }
                }
              `,
          variables: { userId },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }

      // Flatten the nested structure
      const allBookings =
        data?.venues.flatMap((venue) =>
          venue.courts.flatMap((court) =>
            court.slots.flatMap((slot) =>
              slot.bookings.map((booking) => ({
                ...booking,
                venue_name: venue.title,
                court_name: court.name,
                slot: {
                  date: slot.date,
                  start_at: slot.start_at,
                  end_at: slot.end_at,
                  price: slot.price,
                },
              }))
            )
          )
        ) || [];
        calculateSportsDistribution(data?.venues || []);


      // Sort bookings by date and time
      const sortedBookings = allBookings.sort((a, b) => {
        const dateA = new Date(`${a.slot.date} ${a.slot.start_at}`);
        const dateB = new Date(`${b.slot.date} ${b.slot.start_at}`);
        return dateB - dateA;
      });

      setTurfBookings(sortedBookings);
      
      // Calculate today's bookings
      calculateTodayBookings(sortedBookings);
      
      // Calculate weekly revenue
      calculateWeeklyRevenue(sortedBookings);
      
      // Calculate utilization rate
      calculateUtilizationRate(data?.venues || [], sortedBookings);
      
      // Calculate popular time slots for the bar chart
      calculatePopularTimeSlots(sortedBookings);
      
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTodayBookings = (bookings) => {
    console.log("--- Today's Bookings Calculation Start ---");
    console.log("Total bookings received:", bookings.length);
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log("Today's date:", today);
    
    // Get last week's date
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekDate = lastWeek.toISOString().split('T')[0];
    console.log("Same day last week:", lastWeekDate);
    
    // Count today's bookings
    const todayBookings = bookings.filter(booking => booking.slot.date === today);
    const todayCount = todayBookings.length;
    console.log("Today's bookings:", todayBookings.map(b => ({
      date: b.slot.date,
      time: `${b.slot.start_at}-${b.slot.end_at}`,
      venue: b.venue_name,
      court: b.court_name
    })));
    console.log("Today's booking count:", todayCount);
    
    // Count bookings from the same day last week
    const lastWeekBookings = bookings.filter(booking => booking.slot.date === lastWeekDate);
    const lastWeekCount = lastWeekBookings.length;
    console.log("Last week's bookings on same day:", lastWeekBookings.map(b => ({
      date: b.slot.date,
      time: `${b.slot.start_at}-${b.slot.end_at}`,
      venue: b.venue_name,
      court: b.court_name
    })));
    console.log("Last week's booking count on same day:", lastWeekCount);
    
    // Calculate percent change
    let change = 0;
    if (lastWeekCount > 0) {
      change = ((todayCount - lastWeekCount) / lastWeekCount) * 100;
    } else if (todayCount > 0) {
      change = 100; // If last week had 0 but today has some, that's a 100% increase
    }
    
    console.log("Percent change:", change);
    console.log("Final values being set:", {
      count: todayCount,
      change: parseFloat(change.toFixed(1)),
      comparison: "vs last week"
    });
    console.log("--- Today's Bookings Calculation End ---");
    
    setTodayBookings({
      count: todayCount,
      change: parseFloat(change.toFixed(1)),
      comparison: "vs last week"
    });
  };

  const calculateWeeklyRevenue = (bookings) => {
    console.log("--- Weekly Revenue Calculation Start ---");
    console.log("Total bookings received:", bookings.length);
    
    // Get date for 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoString = weekAgo.toISOString().split('T')[0];
    console.log("Week ago date:", weekAgoString);
    
    // Get date for 14 days ago
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoString = twoWeeksAgo.toISOString().split('T')[0];
    console.log("Two weeks ago date:", twoWeeksAgoString);
    
    // Filter bookings from the last 7 days
    const thisWeekBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.slot.date);
      return bookingDate >= weekAgo;
    });
    
    console.log("This week bookings count:", thisWeekBookings.length);
    console.log("This week bookings:", thisWeekBookings.map(b => ({
      date: b.slot.date,
      price: b.slot.price,
      priceType: typeof b.slot.price
    })));
    
    // Filter bookings from 7-14 days ago
    const lastWeekBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.slot.date);
      return bookingDate >= twoWeeksAgo && bookingDate < weekAgo;
    });
    
    console.log("Last week bookings count:", lastWeekBookings.length);
    console.log("Last week bookings:", lastWeekBookings.map(b => ({
      date: b.slot.date,
      price: b.slot.price,
      priceType: typeof b.slot.price
    })));
    
    // Calculate revenue from this week's bookings
    let thisWeekRevenue = 0;
    thisWeekBookings.forEach(booking => {
      const price = booking.slot.price;
      let numericPrice = 0;
      
      console.log("Processing booking price:", price, "Type:", typeof price);
      
      if (price !== null && price !== undefined) {
        // If it's an object with a numeric value property
        if (typeof price === 'object' && price.hasOwnProperty('value')) {
          numericPrice = parseFloat(price.value);
          console.log("  Parsed from object:", numericPrice);
        } 
        // If it's a string that might include currency symbols
        else if (typeof price === 'string') {
          // Remove any non-numeric characters except decimal point
          numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
          console.log("  Parsed from string:", numericPrice);
        }
        // If it's already a number
        else if (typeof price === 'number') {
          numericPrice = price;
          console.log("  Already a number:", numericPrice);
        }
      }
      
      if (isNaN(numericPrice)) {
        console.log("  Warning: Price is NaN, not adding to total");
      } else {
        thisWeekRevenue += numericPrice;
        console.log("  Adding to thisWeekRevenue:", numericPrice, "New total:", thisWeekRevenue);
      }
    });
    
    console.log("Final this week revenue:", thisWeekRevenue);
    
    // Calculate revenue from last week's bookings
    let lastWeekRevenue = 0;
    lastWeekBookings.forEach(booking => {
      const price = booking.slot.price;
      let numericPrice = 0;
      
      if (price !== null && price !== undefined) {
        if (typeof price === 'object' && price.hasOwnProperty('value')) {
          numericPrice = parseFloat(price.value);
        } else if (typeof price === 'string') {
          numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
        } else if (typeof price === 'number') {
          numericPrice = price;
        }
      }
      
      if (!isNaN(numericPrice)) {
        lastWeekRevenue += numericPrice;
      }
    });
    
    console.log("Final last week revenue:", lastWeekRevenue);
    
    // Calculate percent change
    let change = 0;
    if (lastWeekRevenue > 0) {
      change = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
    }
    
    console.log("Percent change:", change);
    console.log("Final values being set:", {
      weekly: thisWeekRevenue,
      change: parseFloat(change.toFixed(1)),
      currency: "₹"
    });
    console.log("--- Weekly Revenue Calculation End ---");
    
    setWeeklyRevenue({
      weekly: thisWeekRevenue,
      change: parseFloat(change.toFixed(1)),
      currency: "₹"
    });
  };
  
  const calculateUtilizationRate = (venues, bookings) => {
    // Get date for 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoString = weekAgo.toISOString().split('T')[0];
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Count total slots available in the last 7 days
    let totalSlots = 0;
    let bookedSlots = 0;
    
    venues.forEach(venue => {
      venue.courts.forEach(court => {
        court.slots.forEach(slot => {
          // Check if the slot is within the last 7 days
          if (slot.date >= weekAgoString && slot.date <= today) {
            totalSlots++;
            
            // Check if the slot has any bookings
            if (slot.bookings && slot.bookings.length > 0) {
              bookedSlots++;
            }
          }
        });
      });
    });
    
    // Calculate utilization rate (booked slots / total slots)
    let rate = 0;
    if (totalSlots > 0) {
      rate = (bookedSlots / totalSlots) * 100;
    }
    
    setUtilizationRate(parseFloat(rate.toFixed(1)));
  };

  const calculatePopularTimeSlots = (bookings) => {
    // Get date for 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Filter bookings from the last 7 days
    const thisWeekBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.slot.date);
      return bookingDate >= weekAgo;
    });
    
    // Initialize count for each half-hour
    const halfHourCounts = {};
    for (let hour = 6; hour < 22; hour++) {
      for (let minute of ['00', '30']) {
        const timeKey = `${hour.toString().padStart(2, '0')}:${minute}`;
        halfHourCounts[timeKey] = 0;
      }
    }
    
    // Count bookings for each half-hour
    thisWeekBookings.forEach(booking => {
      const startTime = booking.slot.start_at;
      // Round to nearest half hour
      const [hour, minute] = startTime.split(':');
      const roundedMinute = parseInt(minute) < 30 ? '00' : '30';
      const timeKey = `${hour}:${roundedMinute}`;
      
      if (halfHourCounts[timeKey] !== undefined) {
        halfHourCounts[timeKey]++;
      }
    });
    
    // Convert to array and find the top time slots
    const timeSlotArray = Object.entries(halfHourCounts).map(([time, count]) => {
      const [hour, minute] = time.split(':');
      const hourNum = parseInt(hour);
      const ampm = hourNum < 12 ? 'AM' : 'PM';
      const hour12 = hourNum % 12 || 12;
      
      return {
        name: `${hour12}:${minute} ${ampm}`,
        bookings: count,
        time: time, // Keep the 24h format for sorting
        fill: hourNum < 12 ? '#8884d8' : hourNum < 16 ? '#82ca9d' : '#ffc658'
      };
    });
    
    // Sort by popularity
    timeSlotArray.sort((a, b) => b.bookings - a.bookings);
    
    // Take top 12 slots for display
    const topTimeSlots = timeSlotArray.slice(0, 12);
    
    // Sort them back by time for display
    topTimeSlots.sort((a, b) => a.time.localeCompare(b.time));
    
    setPopularTimeSlots(topTimeSlots);
  };

  const venueMetrics = {
    totalVenues: 3,
    active: 3,
    maintenance: 0,
    totalBookingsThisWeek: 87,
  };

  const venueHealth = {
    rating: 4.8,
    totalReviews: 142,
    recentReviews: 7,
    utilizationRate: utilizationRate, // Now using calculated value
  };


  const renderCustomizedLabel = (props) => {
    const { x, y, width, value, fill } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill={fill}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {value}
      </text>
    );
  };

  const StatCard = ({
    title,
    value,
    icon,
    change,
    subtitle,
    textColor = "text-blue-600",
    bgColor = "bg-blue-50",
  }) => {
    const Icon = icon;
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{value}</h3>
              {change && (
                <span
                  className={`${
                    change >= 0 ? "text-green-500" : "text-red-500"
                  } text-xs flex items-center`}
                >
                  {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`${bgColor} ${textColor} p-3 rounded-full`}>
            <Icon size={18} />
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (user?.id) {
      fetchTurfBookings(user.id);
    }
  }, [user?.id]);

  return (
    <div className="p-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Today's Bookings"
          value={todayBookings.count}
          icon={Calendar}
          change={todayBookings.change}
          subtitle={todayBookings.comparison}
          textColor="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="Weekly Revenue"
          value={`₹${weeklyRevenue.weekly.toLocaleString()}`}
          icon={TrendingUp}
          change={weeklyRevenue.change}
          textColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Utilization Rate"
          value={`${venueHealth.utilizationRate}%`}
          icon={Activity}
          subtitle="Last 7 days"
          textColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Customer Rating"
          value={venueHealth.rating}
          icon={Star}
          subtitle={`${venueHealth.totalReviews} reviews`}
          textColor="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Most Popular Time Slots */}
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">
            Popular Time Slots (This Week)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                width={500}
                height={300}
                data={popularTimeSlots}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="bookings"
                  fill="#8884d8"
                  label={renderCustomizedLabel}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sport Distribution */}
        {/* Sport Distribution */}
<div className="bg-white p-4 rounded-lg shadow">
  <h2 className="text-lg font-medium mb-4">Sport Distribution</h2>
  {sportDistribution.length > 0 ? (
    <div className="space-y-4">
      {sportDistribution.map((item) => (
        <div key={item.name} className="flex items-center">
          <div className="w-full flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm font-medium">{item.value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: item.color,
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-500 text-center py-4">No sports data available</p>
  )}
</div>
      </div>

      <RecentBookingsCard bookings={bookings} />
    </div>
  );
}