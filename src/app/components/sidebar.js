// components/Sidebar.js
"use client"
import { useState } from 'react';
import { Home, DollarSign, MapPin, Zap, Users, BarChart2, Tag, LogOut } from 'lucide-react';
import { nhost } from '@/lib/nhost';
import { useUserData } from '@nhost/nextjs';

export default function Sidebar({ activeTab, setActiveTab }) {
  const userData = useUserData();
  const handleSignOut = async () => {
    try {
      await nhost.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const SidebarItem = ({ icon, label, active, onClick }) => {
    const Icon = icon;
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-teal-700 ${
          active ? 'bg-teal-700' : ''
        }`}
        onClick={onClick}
      >
        <Icon size={20} color="white" />
        <span className="text-white font-medium">{label}</span>
      </div>
    );
  };

  return (
    <div className="w-64 bg-teal-800 text-white">
      <div className="p-4 flex items-center gap-2 border-b border-teal-700">
        <div className="bg-teal-600 p-2 rounded-full">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" />
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" />
          </svg>
        </div>
        <span className="text-xl font-bold">Playnue</span>
      </div>

      <div className="p-2">
        <SidebarItem icon={Home} label="Home" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <SidebarItem icon={MapPin} label="Venue" active={activeTab === 'venue'} onClick={() => setActiveTab('venue')} />
        <SidebarItem icon={Zap} label="Manage Bookings" active={activeTab === 'offline'} onClick={() => setActiveTab('offline')} />
        <SidebarItem icon={Users} label="Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
      </div>

      <div className="mt-auto p-4 border-t border-teal-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gray-300 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center font-bold">
            
          </div>
          <div>
            <div className="font-bold">{userData?.displayName}</div>
            <div className="text-xs text-gray-300">version 0.0.1</div>
          </div>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-white bg-red-500 hover:bg-red-600 p-2 rounded-md w-full justify-center">
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}