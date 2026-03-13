"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function FamiliesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [familyRegistrations, setFamilyRegistrations] = useState<any[]>([]);
  const [familyCredit, setFamilyCredit] = useState<any>(null);

  // Fetch all families (we'll implement a query for this)
  const families = useQuery(api.families.list) || [];

  // Filter families based on search
  const filteredFamilies = families.filter((family) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      family.email.toLowerCase().includes(searchLower) ||
      family.parentFirstName.toLowerCase().includes(searchLower) ||
      family.parentLastName.toLowerCase().includes(searchLower) ||
      family.phone.includes(searchQuery)
    );
  });

  // Fetch registrations and credit when family is selected
  useEffect(() => {
    if (selectedFamily) {
      fetchFamilyData(selectedFamily.email);
    }
  }, [selectedFamily]);

  const fetchFamilyData = async (email: string) => {
    try {
      // Fetch registrations from Coach Hub
      const regResponse = await fetch(
        `https://harmless-salamander-44.convex.cloud/api/family/${encodeURIComponent(email)}/registrations`
      );
      const registrations = await regResponse.json();
      setFamilyRegistrations(registrations);

      // Fetch credit from Coach Hub
      const creditResponse = await fetch(
        `https://harmless-salamander-44.convex.cloud/api/family/${encodeURIComponent(email)}/credit`
      );
      const credit = await creditResponse.json();
      setFamilyCredit(credit);
    } catch (error) {
      console.error("Error fetching family data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Family CRM</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, phone, or child name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Family List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Families ({filteredFamilies.length})</h2>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {filteredFamilies.map((family) => (
                <button
                  key={family._id}
                  onClick={() => setSelectedFamily(family)}
                  className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                    selectedFamily?._id === family._id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="font-semibold">
                    {family.parentFirstName} {family.parentLastName}
                  </div>
                  <div className="text-sm text-gray-600">{family.email}</div>
                  <div className="text-sm text-gray-500">{family.phone}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Family Details */}
          <div className="lg:col-span-2">
            {selectedFamily ? (
              <div className="space-y-6">
                {/* Contact Info Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">
                    {selectedFamily.parentFirstName} {selectedFamily.parentLastName}
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <div>{selectedFamily.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Phone</div>
                      <div>{selectedFamily.phone}</div>
                    </div>
                    {selectedFamily.address && (
                      <div className="col-span-2">
                        <div className="text-sm text-gray-600">Address</div>
                        <div>{selectedFamily.address}</div>
                      </div>
                    )}
                  </div>

                  {/* Account Credit */}
                  {familyCredit && familyCredit.balance > 0 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                      <div className="font-semibold text-green-800">
                        Account Credit: ${(familyCredit.balance / 100).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedFamily.notes && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-600">Notes</div>
                      <div className="mt-1 p-3 bg-gray-50 rounded">{selectedFamily.notes}</div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedFamily.tags && selectedFamily.tags.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-600 mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedFamily.tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Registrations Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Registrations</h3>
                  {familyRegistrations.length > 0 ? (
                    <div className="space-y-3">
                      {familyRegistrations.map((reg: any, idx: number) => (
                        <div key={idx} className="p-4 border rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold">
                                {reg.playerFirstName} {reg.playerLastName}
                              </div>
                              <div className="text-sm text-gray-600">{reg.programSlug}</div>
                              <div className="text-sm text-gray-500">
                                Status: {reg.status}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                ${(reg.amountPaid / 100).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(reg.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-4">
                      No registrations found
                    </div>
                  )}
                </div>

                {/* Credit Transactions */}
                {familyCredit && familyCredit.transactions && familyCredit.transactions.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Credit History</h3>
                    <div className="space-y-2">
                      {familyCredit.transactions.map((txn: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 border-b">
                          <div>
                            <div className="font-medium">{txn.description}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(txn.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className={txn.amount > 0 ? "text-green-600" : "text-red-600"}>
                            {txn.amount > 0 ? "+" : ""}${(txn.amount / 100).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Add Note
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      Add Credit
                    </button>
                    {selectedFamily.stripeCustomerId && (
                      <a
                        href={`https://dashboard.stripe.com/customers/${selectedFamily.stripeCustomerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        View in Stripe
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                Select a family to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
