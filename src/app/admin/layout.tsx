"use client";

import { useSession, signOut } from "next-auth/react";
import { Navbar, NavbarBrand, Dropdown, DropdownHeader, DropdownItem, DropdownDivider, Avatar } from "flowbite-react";
import Link from "next/link";
import { HiLogout, HiViewGrid } from "react-icons/hi";
import { useState, useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar fluid className="border-b border-gray-200 dark:border-gray-700">
        <NavbarBrand as={Link} href="/admin">
          <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
            UX Research Tool
          </span>
        </NavbarBrand>
        <div className="flex items-center gap-3" suppressHydrationWarning>
          {isClient && (
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <Avatar
                  alt="User"
                  rounded
                  placeholderInitials={session?.user?.name?.[0] || "A"}
                />
              }
            >
            <DropdownHeader>
              <span className="block text-sm">{session?.user?.name}</span>
              <span className="block truncate text-sm font-medium">
                {session?.user?.email}
              </span>
            </DropdownHeader>
            <DropdownItem icon={HiViewGrid} as={Link} href="/admin">
              Dashboard
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={HiLogout} onClick={() => signOut()}>
              Sign out
            </DropdownItem>
          </Dropdown>
          )}
        </div>
      </Navbar>
      <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
