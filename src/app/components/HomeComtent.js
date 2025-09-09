"use client";
import { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Users,
  Star,
  Activity,
  Clock,
  DollarSign,
  Package,
  Share2,
  Download,
  Copy,
  CheckCircle,
  MapPin,
  Phone,
  RefreshCw,
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
import RecentBookingsCard from "./RecentBookingsCard";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
export default function HomeContent({ venueId }) {
  const user = useUserData();
  const router = useRouter();
  const accessToken = useAccessToken();
  const [bookings, setTurfBookings] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [sportDistribution, setSportDistribution] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [slotsPerPage] = useState(12);
  const [selectedCourt, setSelectedCourt] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'available', 'booked'
  const [sortBy, setSortBy] = useState("time");
  // State variables for the metrics
  const [todayBookings, setTodayBookings] = useState({
    count: 0,
    change: 0,
    comparison: "vs last week",
  });
  const [weeklyRevenue, setWeeklyRevenue] = useState({
    weekly: 0,
    change: 0,
    currency: "₹",
  });
  const [totalBookings, setTotalBookings] = useState({
    count: 0,
    monthlyCount: 0,
    change: 0,
  });
  const [totalRevenue, setTotalRevenue] = useState({
    total: 0,
    monthlyTotal: 0,
    change: 0,
  });
  const [popularTimeSlots, setPopularTimeSlots] = useState([]);

  // New states for availability feature
  const [availableSlots, setAvailableSlots] = useState([]);
  const [venueInfo, setVenueInfo] = useState({ name: "" });
  const [copied, setCopied] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const calculateSportsDistribution = (venues) => {
    // Create a counter for each sport
    const sportsCounter = {};

    // Loop through venues and count sports
    venues.forEach((venue) => {
      if (venue.sports && Array.isArray(venue.sports)) {
        venue.sports.forEach((sport) => {
          if (sportsCounter[sport]) {
            sportsCounter[sport]++;
          } else {
            sportsCounter[sport] = 1;
          }
        });
      }
    });

    // Calculate total count
    const totalCount = Object.values(sportsCounter).reduce(
      (sum, count) => sum + count,
      0
    );

    // Convert to percentage and format for display
    const distribution = Object.entries(sportsCounter).map(([name, count]) => {
      return {
        name,
        value: Math.round((count / totalCount) * 100),
      };
    });

    // Sort by value (highest first)
    distribution.sort((a, b) => b.value - a.value);

    // Apply colors
    const colors = [
      "#8884d8",
      "#83a6ed",
      "#8dd1e1",
      "#82ca9d",
      "#a4de6c",
      "#ffc658",
    ];
    const distributionWithColors = distribution.map((item, index) => {
      return { ...item, color: colors[index % colors.length] };
    });

    setSportDistribution(distributionWithColors);
  };

  const calculateTotalBookingsAndRevenue = (bookings) => {
    console.log("--- Total Bookings & Revenue Calculation Start ---");

    // Get date for 30 days ago for monthly comparison
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Filter bookings from the last 30 days
    const thisMonthBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.slot.date);
      return bookingDate >= thirtyDaysAgo;
    });

    // Filter bookings from 30-60 days ago for comparison
    const lastMonthBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.slot.date);
      return bookingDate >= sixtyDaysAgo && bookingDate < thirtyDaysAgo;
    });

    console.log("Total bookings count:", bookings.length);
    console.log("This month bookings count:", thisMonthBookings.length);
    console.log("Last month bookings count:", lastMonthBookings.length);

    // Calculate total revenue
    let totalRevenueAmount = 0;
    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;

    // Helper function to extract numeric price
    const getNumericPrice = (price) => {
      let numericPrice = 0;

      if (price !== null && price !== undefined) {
        if (typeof price === "object" && price.hasOwnProperty("value")) {
          numericPrice = parseFloat(price.value);
        } else if (typeof price === "string") {
          numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
        } else if (typeof price === "number") {
          numericPrice = price;
        }
      }

      return isNaN(numericPrice) ? 0 : numericPrice;
    };

    // Calculate total revenue from all bookings
    bookings.forEach((booking) => {
      totalRevenueAmount += getNumericPrice(booking.slot.price);
    });

    // Calculate this month's revenue
    thisMonthBookings.forEach((booking) => {
      thisMonthRevenue += getNumericPrice(booking.slot.price);
    });

    // Calculate last month's revenue
    lastMonthBookings.forEach((booking) => {
      lastMonthRevenue += getNumericPrice(booking.slot.price);
    });

    // Calculate percent changes
    let bookingsChange = 0;
    if (lastMonthBookings.length > 0) {
      bookingsChange =
        ((thisMonthBookings.length - lastMonthBookings.length) /
          lastMonthBookings.length) *
        100;
    } else if (thisMonthBookings.length > 0) {
      bookingsChange = 100;
    }

    let revenueChange = 0;
    if (lastMonthRevenue > 0) {
      revenueChange =
        ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (thisMonthRevenue > 0) {
      revenueChange = 100;
    }

    console.log("Total bookings:", bookings.length);
    console.log("Total revenue:", totalRevenueAmount);
    console.log("Bookings change:", bookingsChange);
    console.log("Revenue change:", revenueChange);
    console.log("--- Total Bookings & Revenue Calculation End ---");

    setTotalBookings({
      count: bookings.length,
      monthlyCount: thisMonthBookings.length,
      change: parseFloat(bookingsChange.toFixed(1)),
    });

    setTotalRevenue({
      total: totalRevenueAmount,
      monthlyTotal: thisMonthRevenue,
      change: parseFloat(revenueChange.toFixed(1)),
    });
  };

  // New function to calculate available slots
  const calculateAvailableSlots = (venues, selectedDate) => {
    if (!venues || venues.length === 0) return [];

    const venue = venues[0];
    setVenueInfo({
      name: venue.title,
      address: venue.address || "Add venue address",
      phone: venue.phone || "Add contact number",
    });

    const allSlotsByDate = [];

    venue.courts.forEach((court) => {
      const courtSlots = court.slots.filter(
        (slot) => slot.date === selectedDate
      );

      // Sort slots by start time
      courtSlots.sort((a, b) => a.start_at.localeCompare(b.start_at));

      if (courtSlots.length > 0) {
        allSlotsByDate.push({
          courtName: court.name,
          slots: courtSlots, // Keep all slots (both booked and available)
        });
      }
    });

    setAvailableSlots(allSlotsByDate);
  };

  const fetchTurfBookings = async (venueId) => {
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
            query GetSellerBookings($venueId: uuid!) {
              venues(where: { id: { _eq: $venueId } }) {
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
                    booked
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
          variables: { venueId },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }

      // Calculate available slots for today
      calculateAvailableSlots(data?.venues || [], selectedDate);

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

      // Calculate all metrics
      calculateTodayBookings(sortedBookings);
      calculateWeeklyRevenue(sortedBookings);
      calculateTotalBookingsAndRevenue(sortedBookings);
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
    const today = new Date().toISOString().split("T")[0];
    console.log("Today's date:", today);

    // Get last week's date
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekDate = lastWeek.toISOString().split("T")[0];

    console.log("Same day last week:", lastWeekDate);

    // Count today's bookings
    const todayBookings = bookings.filter(
      (booking) => booking.slot.date === today
    );
    const todayCount = todayBookings.length;
    console.log("Today's booking count:", todayCount);

    // Count bookings from the same day last week
    const lastWeekBookings = bookings.filter(
      (booking) => booking.slot.date === lastWeekDate
    );
    const lastWeekCount = lastWeekBookings.length;
    console.log("Last week's booking count on same day:", lastWeekCount);

    // Calculate percent change
    let change = 0;
    if (lastWeekCount > 0) {
      change = ((todayCount - lastWeekCount) / lastWeekCount) * 100;
    } else if (todayCount > 0) {
      change = 100;
    }

    console.log("Percent change:", change);
    console.log("--- Today's Bookings Calculation End ---");

    setTodayBookings({
      count: todayCount,
      change: parseFloat(change.toFixed(1)),
      comparison: "vs last week",
    });
  };

  const calculateWeeklyRevenue = (bookings) => {
    console.log("--- Weekly Revenue Calculation Start ---");

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoString = weekAgo.toISOString().split("T")[0];

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoString = twoWeeksAgo.toISOString().split("T")[0];

    const thisWeekBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.slot.date);
      return bookingDate >= weekAgo;
    });

    const lastWeekBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.slot.date);
      return bookingDate >= twoWeeksAgo && bookingDate < weekAgo;
    });

    // Helper function to extract numeric price
    const getNumericPrice = (price) => {
      let numericPrice = 0;

      if (price !== null && price !== undefined) {
        if (typeof price === "object" && price.hasOwnProperty("value")) {
          numericPrice = parseFloat(price.value);
        } else if (typeof price === "string") {
          numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
        } else if (typeof price === "number") {
          numericPrice = price;
        }
      }

      return isNaN(numericPrice) ? 0 : numericPrice;
    };

    let thisWeekRevenue = 0;
    thisWeekBookings.forEach((booking) => {
      thisWeekRevenue += getNumericPrice(booking.slot.price);
    });

    let lastWeekRevenue = 0;
    lastWeekBookings.forEach((booking) => {
      lastWeekRevenue += getNumericPrice(booking.slot.price);
    });

    let change = 0;
    if (lastWeekRevenue > 0) {
      change = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
    }

    console.log("--- Weekly Revenue Calculation End ---");

    setWeeklyRevenue({
      weekly: thisWeekRevenue,
      change: parseFloat(change.toFixed(1)),
      currency: "₹",
    });
  };

  const calculatePopularTimeSlots = (bookings) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const thisWeekBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.slot.date);
      return bookingDate >= weekAgo;
    });

    const halfHourCounts = {};
    for (let hour = 6; hour < 22; hour++) {
      for (let minute of ["00", "30"]) {
        const timeKey = `${hour.toString().padStart(2, "0")}:${minute}`;
        halfHourCounts[timeKey] = 0;
      }
    }

    thisWeekBookings.forEach((booking) => {
      const startTime = booking.slot.start_at;
      const [hour, minute] = startTime.split(":");
      const roundedMinute = parseInt(minute) < 30 ? "00" : "30";
      const timeKey = `${hour}:${roundedMinute}`;

      if (halfHourCounts[timeKey] !== undefined) {
        halfHourCounts[timeKey]++;
      }
    });

    const timeSlotArray = Object.entries(halfHourCounts).map(
      ([time, count]) => {
        const [hour, minute] = time.split(":");
        const hourNum = parseInt(hour);
        const ampm = hourNum < 12 ? "AM" : "PM";
        const hour12 = hourNum % 12 || 12;

        return {
          name: `${hour12}:${minute} ${ampm}`,
          bookings: count,
          time: time,
          fill: hourNum < 12 ? "#8884d8" : hourNum < 16 ? "#82ca9d" : "#ffc658",
        };
      }
    );

    timeSlotArray.sort((a, b) => b.bookings - a.bookings);
    const topTimeSlots = timeSlotArray.slice(0, 12);
    topTimeSlots.sort((a, b) => a.time.localeCompare(b.time));

    setPopularTimeSlots(topTimeSlots);
  };

  // Helper functions for availability feature
  const formatTime12Hour = (time24) => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const calculateDuration = (start, end) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);

    const totalStartMinutes = startHours * 60 + startMinutes;
    const totalEndMinutes = endHours * 60 + endMinutes;

    const durationMinutes = totalEndMinutes - totalStartMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}.${minutes === 30 ? "5" : "0"} hours`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else {
      return `${minutes} mins`;
    }
  };

  const generateShareableText = () => {
    if (availableSlots.length === 0) return "";

    const dateObj = new Date(selectedDate);
    const formattedDate = dateObj.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let message = `🏟️ *${venueInfo.name} - Slots Available!*\n`;
    message += `📅 ${formattedDate}\n\n`;

    availableSlots.forEach((court) => {
      const availableSlots = court.slots.filter((slot) => !slot.booked);
      if (availableSlots.length > 0) {
        message += `✅ *${court.courtName}:*\n`;
        availableSlots.slice(0, 6).forEach((slot) => {
          // Limit to 6 slots for sharing
          const duration = calculateDuration(slot.start_at, slot.end_at);
          message += `• ${formatTime12Hour(slot.start_at)} - ${formatTime12Hour(
            slot.end_at
          )} (${duration}) - ₹${slot.price.toString().replace("₹", "")}\n`;
        });
        if (availableSlots.length > 6) {
          message += `• +${availableSlots.length - 6} more slots available\n`;
        }
        message += "\n";
      }
    });

    message += `⚡ Hurry! Limited slots available.`;

    return message;
  };

  const copyToClipboard = () => {
    const text = generateShareableText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const refreshAvailability = () => {
    setIsLoadingAvailability(true);
    fetchTurfBookings(venueId);
    setTimeout(() => setIsLoadingAvailability(false), 1000);
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

  const formatPrice = (price) => {
    if (!price) return "₹0";
    return `₹${price.toString().replace("₹", "")}`;
  };

  const getSlotDurationInMinutes = (start, end) => {
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  };

  const getAllSlots = () => {
    let allSlots = [];
    availableSlots.forEach((court) => {
      court.slots.forEach((slot) => {
        allSlots.push({
          ...slot,
          courtName: court.courtName,
          durationMinutes: getSlotDurationInMinutes(slot.start_at, slot.end_at),
        });
      });
    });
    return allSlots;
  };

  const getFilteredAndSortedSlots = () => {
    let slots = getAllSlots();

    // Filter by court
    if (selectedCourt !== "all") {
      slots = slots.filter((slot) => slot.courtName === selectedCourt);
    }

    // Filter by status
    if (filterStatus === "available") {
      slots = slots.filter((slot) => !slot.booked);
    } else if (filterStatus === "booked") {
      slots = slots.filter((slot) => slot.booked);
    }

    // Sort
    slots.sort((a, b) => {
      switch (sortBy) {
        case "price":
          const priceA = parseFloat(a.price.toString().replace("₹", ""));
          const priceB = parseFloat(b.price.toString().replace("₹", ""));
          return priceA - priceB;
        case "duration":
          return a.durationMinutes - b.durationMinutes;
        case "time":
        default:
          return a.start_at.localeCompare(b.start_at);
      }
    });

    return slots;
  };

  const getPaginatedSlots = () => {
    const filteredSlots = getFilteredAndSortedSlots();
    const startIndex = (currentPage - 1) * slotsPerPage;
    const endIndex = startIndex + slotsPerPage;
    return filteredSlots.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredSlots = getFilteredAndSortedSlots();
    return Math.ceil(filteredSlots.length / slotsPerPage);
  };

  const getUniqueCourtNames = () => {
    return [...new Set(availableSlots.map((court) => court.courtName))];
  };

  // Reset pagination when filters change
  const handleFilterChange = (type, value) => {
    setCurrentPage(1);
    if (type === "court") setSelectedCourt(value);
    if (type === "status") setFilterStatus(value);
    if (type === "sort") setSortBy(value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.push("/login");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, router]);

  useEffect(() => {
    if (user?.id && venueId) {
      fetchTurfBookings(venueId);
    }
  }, [user?.id, venueId, selectedDate]);

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
          title="Total Bookings"
          value={totalBookings.count}
          icon={Package}
          change={totalBookings.change}
          textColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.total.toLocaleString()}`}
          icon={DollarSign}
          change={totalRevenue.change}
          textColor="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      {/* Availability Share Widget */}
      {/* // Replace the entire "Availability Share Widget" section with this more compact version: */}

      {/* Compact Availability Share Widget */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-500" />
              Share Availability
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={refreshAvailability}
                className={`p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-all ${
                  isLoadingAvailability ? "animate-spin" : ""
                }`}
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Simple Shareable Card - matching your screenshot style */}
          <div
            id="availability-card"
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
          >
            {/* Header matching screenshot */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Playnue"
                  className="h-6 w-auto"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {venueInfo.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedDate).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Booked</span>
                </div>
              </div>
            </div>

            {/* Inline Filters - single row like screenshot */}
            <div className="flex items-center gap-4 mb-4">
              <select
                value={selectedCourt}
                onChange={(e) => handleFilterChange("court", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Courts</option>
                {getUniqueCourtNames().map((court) => (
                  <option key={court} value={court}>
                    {court}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="time">Time</option>
                <option value="price">Price</option>
                <option value="duration">Duration</option>
              </select>
            </div>

            {availableSlots.length > 0 ? (
              <div>
                {/* Clean slots grid matching screenshot */}
                <div className="grid grid-cols-8 gap-3 mb-4">
                  {getPaginatedSlots()
                    .slice(0, 16)
                    .map((slot, index) => (
                      <div
                        key={`${slot.courtName}-${slot.start_at}-${index}`}
                        className={`relative rounded-lg p-3 border-2 text-center ${
                          slot.booked
                            ? "bg-red-50 border-red-200"
                            : "bg-green-50 border-green-200"
                        }`}
                      >
                        <div
                          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                            slot.booked ? "bg-red-500" : "bg-green-500"
                          }`}
                        ></div>

                        <div className="text-xs font-semibold text-blue-700 mb-1">
                          {slot.courtName}
                        </div>

                        <div className="text-sm font-bold text-gray-900 mb-1">
                          {formatTime12Hour(slot.start_at)}
                        </div>

                        <div className="text-sm font-bold text-green-700">
                          {formatPrice(slot.price.slice(1))}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Simple pagination */}
                {getTotalPages() > 1 && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      ‹
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentPage} of {getTotalPages()}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(
                          Math.min(getTotalPages(), currentPage + 1)
                        )
                      }
                      disabled={currentPage === getTotalPages()}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      ›
                    </button>
                  </div>
                )}

                {/* Stats row matching screenshot */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {getAllSlots().filter((slot) => !slot.booked).length}
                    </div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {getAllSlots().filter((slot) => slot.booked).length}
                    </div>
                    <div className="text-sm text-gray-600">Booked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {getAllSlots().length}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(
                        (getAllSlots().filter((slot) => !slot.booked).length /
                          getAllSlots().length) *
                          100
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  No slots found for selected date
                </p>
              </div>
            )}
          </div>

          {/* Action buttons matching screenshot */}
          {availableSlots.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={copyToClipboard}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const element = document.getElementById("availability-card");
                  if (element) {
                    html2canvas(element, {
                      backgroundColor: "#ffffff",
                      scale: 2,
                      logging: false,
                      useCORS: true,
                      allowTaint: true,
                    })
                      .then((canvas) => {
                        const link = document.createElement("a");
                        link.download = `${venueInfo.name.replace(
                          /[^a-zA-Z0-9]/g,
                          "_"
                        )}_availability_${selectedDate}.png`;
                        link.href = canvas.toDataURL("image/png", 1.0);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      })
                      .catch((error) => {
                        console.error("Error generating image:", error);
                        alert("Failed to generate image. Please try again.");
                      });
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Popular Time Slots Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Time Slots (This Week)
          </h2>
          <div className="h-64">
            {popularTimeSlots.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
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
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No booking data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Sport Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sport Distribution
          </h2>
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
                        className="h-2 rounded-full transition-all duration-500"
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
            <p className="text-gray-500 text-center py-4">
              No sports data available
            </p>
          )}
        </div>
      </div>

      <RecentBookingsCard bookings={bookings} />
    </div>
  );
}
