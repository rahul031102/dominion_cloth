import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  fetchUserProfile,
  updateUserProfileApi,
  fetchAddresses,
  addAddressApi,
  updateAddressApi,
  deleteAddressApi,
} from "../api/products.js";

export default function Profile() {
  const { user, loading: authLoading, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeSubTab, setActiveSubTab] = useState("info"); // info, addresses
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); // null if creating
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      showToast("Access denied. Please login first.");
      navigate("/login");
    } else if (user) {
      setProfile({ name: user.name || "", phone: user.phone || "" });
      loadAddresses();
    }
  }, [user, authLoading, navigate]);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await fetchAddresses();
      setAddresses(data);
    } catch (err) {
      console.error(err);
      showToast("Error retrieving addresses.");
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const updated = await updateUserProfileApi(profile);
      showToast("Profile details updated successfully!");
      // Merge updated details into local state by updating context if needed
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      userInfo.name = updated.name;
      userInfo.phone = updated.phone;
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddressInputChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setAddressForm({ ...addressForm, [e.target.name]: val });
  };

  const openAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      phone: profile.phone || "",
      isDefault: addresses.length === 0,
    });
    setShowAddressForm(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || "India",
      phone: addr.phone,
      isDefault: addr.isDefault,
    });
    setShowAddressForm(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      let updatedList;
      if (editingAddressId) {
        updatedList = await updateAddressApi(editingAddressId, addressForm);
        showToast("Address modified successfully.");
      } else {
        updatedList = await addAddressApi(addressForm);
        showToast("New address added successfully.");
      }
      setAddresses(updatedList);
      setShowAddressForm(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Error saving address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        const updatedList = await deleteAddressApi(id);
        setAddresses(updatedList);
        showToast("Address deleted.");
      } catch (err) {
        showToast("Failed to delete address.");
      }
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      const updatedList = await updateAddressApi(addr._id, { ...addr, isDefault: true });
      setAddresses(updatedList);
      showToast("Default address updated.");
    } catch (err) {
      showToast("Failed to update default address.");
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500 bg-paper">
        <div className="skeleton h-12 w-48 mx-auto rounded mb-8" />
        <div className="skeleton h-48 w-full rounded" />
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-8 py-10 page-enter bg-paper text-ink font-body">
      
      {/* Top Welcome Panel */}
      <div className="border border-line bg-white p-6 rounded shadow-sm mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-navy">
            Dashboard Profile
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            Registered: {user?.email}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/orders"
            className="px-4 py-2 bg-navy text-white text-xs font-bold uppercase rounded shadow hover:opacity-90 transition-all tracking-wider"
          >
            Track Orders
          </Link>
          <button
            onClick={() => {
              logout();
              showToast("Logged out successfully.");
              navigate("/");
            }}
            className="px-4 py-2 border border-line text-crimson text-xs font-bold uppercase rounded hover:bg-paper transition-all tracking-wider"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        
        {/* Left Side: Navigation Tabs */}
        <div className="md:col-span-1 border border-line bg-white p-4 rounded shadow-sm h-max space-y-1">
          <button
            onClick={() => {
              setActiveSubTab("info");
              setShowAddressForm(false);
            }}
            className={`w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider transition-all ${
              activeSubTab === "info" ? "bg-navy text-white" : "text-gray-600 hover:bg-[#FAFAF8] hover:text-navy"
            }`}
          >
            Personal Details
          </button>
          <button
            onClick={() => {
              setActiveSubTab("addresses");
              setShowAddressForm(false);
            }}
            className={`w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-wider transition-all ${
              activeSubTab === "addresses" ? "bg-navy text-white" : "text-gray-600 hover:bg-[#FAFAF8] hover:text-navy"
            }`}
          >
            Saved Addresses
          </button>
        </div>

        {/* Right Side: Active Workspace */}
        <div className="md:col-span-3 border border-line bg-white p-6 md:p-8 rounded shadow-sm h-max">
          
          {/* PERSONAL DETAILS WORKSPACE */}
          {activeSubTab === "info" && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy border-b border-line pb-3 mb-6">
                Personal details
              </h2>
              
              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                    Account Display Name
                  </label>
                  <input
                    required
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                    Mobile Contact Number
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-semibold"
                    placeholder="Enter phone number"
                  />
                </div>

                <button
                  disabled={updatingProfile}
                  type="submit"
                  className="px-6 py-3 bg-navy text-white text-xs font-bold uppercase tracking-widest rounded shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {updatingProfile ? "SAVING..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* SAVED ADDRESSES WORKSPACE */}
          {activeSubTab === "addresses" && !showAddressForm && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-line pb-3 mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
                  Saved Delivery Locations
                </h2>
                <button
                  onClick={openAddAddress}
                  className="bg-navy text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded shadow hover:opacity-90 transition-all"
                >
                  Add Address
                </button>
              </div>

              {loadingAddresses ? (
                <div className="text-center py-10 text-gray-400">Loading addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-line rounded text-xs text-gray-500">
                  No saved delivery addresses found. Add one to speed up checkout.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div
                      key={a._id}
                      className={`border p-4 rounded-lg relative ${
                        a.isDefault ? "border-navy bg-navy/5 shadow-xs" : "border-line bg-white"
                      }`}
                    >
                      {a.isDefault && (
                        <span className="absolute top-3 right-3 text-[9px] font-bold bg-navy text-white px-2 py-0.5 rounded-sm uppercase tracking-wide">
                          Default
                        </span>
                      )}

                      <h4 className="font-bold text-xs uppercase tracking-wide mb-1 text-ink">{profile.name}</h4>
                      <p className="text-gray-500 text-[11px] font-semibold mb-2">{a.phone}</p>
                      <p className="text-gray-400 leading-relaxed font-sans text-xs mb-4">
                        {a.street}, {a.city}, {a.state} - {a.postalCode}, {a.country}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider mt-2 border-t border-line/60 pt-3">
                        <button onClick={() => openEditAddress(a)} className="text-navy hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteAddress(a._id)} className="text-crimson hover:underline">
                          Delete
                        </button>
                        {!a.isDefault && (
                          <button onClick={() => handleSetDefault(a)} className="text-gray-500 hover:text-navy hover:underline">
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SAVED ADDRESS FORM EDITOR */}
          {activeSubTab === "addresses" && showAddressForm && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy border-b border-line pb-3 mb-6">
                {editingAddressId ? "Modify Address" : "Add Delivery Address"}
              </h2>

              <form onSubmit={handleAddressSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                    Street Address / Flat No.
                  </label>
                  <input
                    required
                    name="street"
                    type="text"
                    value={addressForm.street}
                    onChange={handleAddressInputChange}
                    className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-semibold"
                    placeholder="Flat/House No., Building Name, Street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                      City
                    </label>
                    <input
                      required
                      name="city"
                      type="text"
                      value={addressForm.city}
                      onChange={handleAddressInputChange}
                      className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-semibold"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                      State
                    </label>
                    <input
                      required
                      name="state"
                      type="text"
                      value={addressForm.state}
                      onChange={handleAddressInputChange}
                      className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-semibold"
                      placeholder="Maharashtra"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                      Postal Code / Pincode
                    </label>
                    <input
                      required
                      name="postalCode"
                      type="text"
                      value={addressForm.postalCode}
                      onChange={handleAddressInputChange}
                      className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-semibold"
                      placeholder="400001"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                      Country
                    </label>
                    <input
                      required
                      name="country"
                      type="text"
                      value={addressForm.country}
                      onChange={handleAddressInputChange}
                      className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                    Delivery Contact Phone
                  </label>
                  <input
                    required
                    name="phone"
                    type="text"
                    value={addressForm.phone}
                    onChange={handleAddressInputChange}
                    className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-semibold"
                    placeholder="10-digit number"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink uppercase">
                    <input
                      name="isDefault"
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={handleAddressInputChange}
                      className="accent-navy"
                    />
                    <span>Set as Default Delivery Address</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-3 border-t border-line/60">
                  <button
                    disabled={savingAddress}
                    type="submit"
                    className="px-6 py-3 bg-navy text-white text-xs font-bold uppercase tracking-widest rounded shadow hover:opacity-90 active:scale-95 transition-all"
                  >
                    {savingAddress ? "SAVING..." : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="px-6 py-3 border border-line text-ink text-xs font-bold uppercase tracking-widest rounded hover:bg-paper transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

    </section>
  );
}
