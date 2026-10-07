import React, { useState, useEffect } from 'react';
import { FiX, FiMapPin, FiSearch, FiCheck, FiImage, FiClock, FiDollarSign, FiInfo, FiCompass, FiTag } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { placesAPI, geocodeAPI } from '../utils/api';

// Marker icon
const pinIcon = L.divIcon({
    className: 'custom-pin-marker',
    html: `<div style="background: linear-gradient(135deg, #0ea5e9, #6366f1); width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
            <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
           </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
});

// Mini map click listener to pick coordinates
const LocationPicker = ({ position, setPosition, onAddressFound }) => {
    const map = useMap();

    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            map.flyTo([lat, lng], map.getZoom());

            try {
                const res = await geocodeAPI.reverseGeocode(lat, lng);
                if (res.data?.display_name && onAddressFound) {
                    onAddressFound(res.data.display_name, res.data.address);
                }
            } catch (err) {
                console.warn('Reverse geocode failed:', err);
            }
        }
    });

    useEffect(() => {
        if (position && position[0] && position[1]) {
            map.setView(position, map.getZoom());
        }
    }, [position, map]);

    return position ? <Marker position={position} icon={pinIcon} /> : null;
};

const POPULAR_CITIES = [
    'Bhubaneswar',
    'Puri',
    'Cuttack',
    'Konark',
    'Chilika',
    'Sambalpur',
    'Gopalpur',
    'Rourkela'
];

const CATEGORIES = [
    { id: 'tourist_place', name: 'Tourist Place', icon: '🏛️' },
    { id: 'temple', name: 'Temple', icon: '🛕' },
    { id: 'historical', name: 'Historical', icon: '📜' },
    { id: 'park', name: 'Nature & Park', icon: '🌳' },
    { id: 'cafe', name: 'Cafe', icon: '☕' },
    { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
    { id: 'mall', name: 'Mall', icon: '🏬' },
    { id: 'hotel', name: 'Hotel', icon: '🏨' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'museum', name: 'Museum', icon: '🏺' }
];

const PRESET_IMAGES = {
    temple: [
        'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=800',
        'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800'
    ],
    tourist_place: [
        'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
        'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800'
    ],
    historical: [
        'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800',
        'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800'
    ],
    park: [
        'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800',
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800'
    ],
    cafe: [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800'
    ],
    restaurant: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'
    ],
    hotel: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'
    ],
    mall: [
        'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=800'
    ],
    shopping: [
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800'
    ],
    museum: [
        'https://images.unsplash.com/photo-1565034946487-077786996e27?w=800'
    ]
};

const AMENITY_OPTIONS = [
    'Parking Available',
    'Restrooms',
    'Wheelchair Accessible',
    'Guided Tours',
    'Photography Allowed',
    'Food & Snacks Stalls',
    'Drinking Water',
    'Wi-Fi Available',
    'Kids Friendly',
    'Card / UPI Payment'
];

const AddPlaceModal = ({ isOpen, onClose, onPlaceAdded, initialLocation }) => {
    const defaultLat = initialLocation?.lat || 20.2961;
    const defaultLng = initialLocation?.lng || 85.8245;

    const [formData, setFormData] = useState({
        name: '',
        category: 'tourist_place',
        city: 'Bhubaneswar',
        customCity: '',
        address: '',
        latitude: defaultLat,
        longitude: defaultLng,
        description: '',
        entryFee: 'Free',
        openTime: '08:00 AM',
        closeTime: '07:00 PM',
        openDays: 'All days',
        bestTimeToVisit: 'October to March',
        imageUrl: '',
        phone: '',
        website: '',
        amenities: ['Parking Available', 'Photography Allowed']
    });

    const [mapPosition, setMapPosition] = useState([defaultLat, defaultLng]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            const lat = initialLocation?.lat || 20.2961;
            const lng = initialLocation?.lng || 85.8245;
            setMapPosition([lat, lng]);
            setFormData(prev => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                imageUrl: PRESET_IMAGES[prev.category]?.[0] || 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=800'
            }));
            setError(null);
            setSuccessMessage('');
        }
    }, [isOpen, initialLocation]);

    if (!isOpen) return null;

    const handleCategoryChange = (category) => {
        const presets = PRESET_IMAGES[category] || [];
        setFormData(prev => ({
            ...prev,
            category,
            imageUrl: presets[0] || prev.imageUrl
        }));
    };

    const handleAddressSearch = async (e) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        setError(null);
        try {
            const city = formData.customCity || formData.city;
            const res = await geocodeAPI.searchPlaces(searchQuery, city);
            if (res.data && res.data.length > 0) {
                setSearchResults(res.data);
            } else {
                setSearchResults([]);
                setError('No locations found for this query. Try clicking directly on the map!');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Location search failed. You can pin location manually on the map.');
        } finally {
            setSearching(false);
        }
    };

    const selectSearchResult = (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setMapPosition([lat, lng]);
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: result.display_name || prev.address
        }));
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleMapAddressFound = (displayName, addressDetails) => {
        setFormData(prev => {
            const cityName = addressDetails?.city || addressDetails?.town || addressDetails?.suburb || prev.city;
            return {
                ...prev,
                latitude: mapPosition[0],
                longitude: mapPosition[1],
                address: displayName,
                city: POPULAR_CITIES.includes(cityName) ? cityName : prev.city
            };
        });
    };

    const toggleAmenity = (amenity) => {
        setFormData(prev => {
            const current = prev.amenities;
            if (current.includes(amenity)) {
                return { ...prev, amenities: current.filter(a => a !== amenity) };
            } else {
                return { ...prev, amenities: [...current, amenity] };
            }
        });
    };

    const useCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setMapPosition([lat, lng]);
                    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                },
                (err) => {
                    setError('Could not access current location: ' + err.message);
                }
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.name.trim()) {
            setError('Please provide a place name.');
            return;
        }

        if (!formData.description.trim()) {
            setError('Please provide a description.');
            return;
        }

        const city = formData.customCity.trim() || formData.city;

        setSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                shortDescription: formData.description.length > 150 ? formData.description.substring(0, 147) + '...' : formData.description,
                category: formData.category,
                city: city,
                state: 'Odisha',
                address: formData.address || `${formData.name}, ${city}, Odisha`,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
                    address: formData.address || `${formData.name}, ${city}, Odisha`,
                    city: city,
                    state: 'Odisha'
                },
                images: [
                    {
                        url: formData.imageUrl || PRESET_IMAGES[formData.category]?.[0] || 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=800',
                        caption: formData.name
                    }
                ],
                entryFee: formData.entryFee || 'Free',
                timing: {
                    open: formData.openTime || '08:00 AM',
                    close: formData.closeTime || '07:00 PM',
                    days: formData.openDays || 'All days'
                },
                contact: {
                    phone: formData.phone,
                    website: formData.website
                },
                amenities: formData.amenities,
                bestTimeToVisit: formData.bestTimeToVisit,
                rating: 4.5,
                reviewCount: 1,
                isFeatured: false,
                isTrending: true,
                popularity: 85
            };

            const response = await placesAPI.create(payload);
            setSuccessMessage(`🎉 "${formData.name}" added successfully to ${city}!`);

            if (onPlaceAdded) {
                onPlaceAdded(response.data.data);
            }

            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err) {
            console.error('Error adding place:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to add place';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-all animate-fadeIn">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-transparent">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/30">
                            <FiMapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Location / Place</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Discover and share new travel destinations across Odisha</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-6">
                    {error && (
                        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start space-x-2">
                            <FiInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center space-x-2">
                            <FiCheck className="w-5 h-5 flex-shrink-0" />
                            <span className="font-semibold">{successMessage}</span>
                        </div>
                    )}

                    {/* Section 1: Basic Info */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                            Place Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Dhauli Shanti Stupa, Golden Beach, Khandagiri Caves..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                        />
                    </div>

                    {/* Category Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => handleCategoryChange(cat.id)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                                        formData.category === cat.id
                                            ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 text-primary-700 dark:text-primary-300 shadow-sm'
                                            : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-base">{cat.icon}</span>
                                    <span className="truncate">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* City Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            City / District <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {POPULAR_CITIES.map((city) => (
                                <button
                                    key={city}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, city, customCity: '' })}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                        formData.city === city && !formData.customCity
                                            ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Or type a custom city/town name (e.g. Koraput, Balasore, Mayurbhanj)..."
                            value={formData.customCity}
                            onChange={(e) => setFormData({ ...formData, customCity: e.target.value })}
                            className="w-full px-4 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>

                    {/* Section 2: Interactive Location & Map Picker */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5">
                                <FiCompass className="text-primary-500" />
                                <span>Pinpoint Location on Map</span>
                            </label>
                            <button
                                type="button"
                                onClick={useCurrentLocation}
                                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center space-x-1"
                            >
                                <FiCompass className="w-3.5 h-3.5" />
                                <span>Use GPS Location</span>
                            </button>
                        </div>

                        {/* Search Address Bar */}
                        <div className="relative">
                            <div className="flex space-x-2">
                                <div className="relative flex-1">
                                    <FiSearch className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search address or landmark to auto-pin..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch(e)}
                                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddressSearch}
                                    disabled={searching}
                                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {searching ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                    {searchResults.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => selectSearchResult(item)}
                                            className="w-full text-left px-3.5 py-2 hover:bg-primary-50 dark:hover:bg-gray-700/50 text-xs text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                                        >
                                            <p className="font-semibold truncate">{item.display_name.split(',')[0]}</p>
                                            <p className="text-[10px] text-gray-400 truncate">{item.display_name}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Interactive Mini Map */}
                        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 h-52 sm:h-60 w-full shadow-inner">
                            <MapContainer
                                center={mapPosition}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution="&copy; OpenStreetMap contributors"
                                />
                                <LocationPicker
                                    position={mapPosition}
                                    setPosition={(pos) => {
                                        setMapPosition(pos);
                                        setFormData(prev => ({ ...prev, latitude: pos[0], longitude: pos[1] }));
                                    }}
                                    onAddressFound={handleMapAddressFound}
                                />
                            </MapContainer>
                            <div className="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-gray-600 dark:text-gray-300 z-[1000] flex items-center justify-between shadow-sm">
                                <span>📍 Click anywhere on map to reposition pin</span>
                                <span className="font-mono">{formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</span>
                            </div>
                        </div>

                        {/* Address text */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Full Address / Landmark
                            </label>
                            <input
                                type="text"
                                placeholder="Specific street, area or landmark..."
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Section 3: Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                            Description & Overview <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Describe what makes this place special, historical significance, what to see/do..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>

                    {/* Section 4: Image URL & Presets */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5">
                                <FiImage className="text-primary-500" />
                                <span>Place Image</span>
                            </label>
                            <span className="text-[11px] text-gray-400">Select preset or paste custom URL</span>
                        </div>

                        {/* Presets */}
                        {PRESET_IMAGES[formData.category] && (
                            <div className="flex items-center space-x-2 mb-2">
                                {PRESET_IMAGES[formData.category].map((imgUrl, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, imageUrl: imgUrl })}
                                        className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                            formData.imageUrl === imgUrl
                                                ? 'border-primary-500 scale-105 shadow-md'
                                                : 'border-transparent opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={imgUrl} alt="Preset" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex space-x-3 items-center">
                            <input
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                className="flex-1 px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                            {formData.imageUrl && (
                                <img
                                    src={formData.imageUrl}
                                    alt="Preview"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                    className="w-10 h-10 rounded-lg object-cover border border-gray-300 dark:border-gray-700 shadow-sm"
                                />
                            )}
                        </div>
                    </div>

                    {/* Section 5: Visit Details (Timing, Entry Fee, Best Time) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center space-x-1">
                                <FiDollarSign />
                                <span>Entry Fee</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Free or ₹20"
                                value={formData.entryFee}
                                onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center space-x-1">
                                <FiClock />
                                <span>Timing</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 6:00 AM - 8:00 PM"
                                value={`${formData.openTime} - ${formData.closeTime}`}
                                onChange={(e) => {
                                    const parts = e.target.value.split('-');
                                    setFormData({
                                        ...formData,
                                        openTime: parts[0]?.trim() || '',
                                        closeTime: parts[1]?.trim() || ''
                                    });
                                }}
                                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Best Season to Visit
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Oct - Mar"
                                value={formData.bestTimeToVisit}
                                onChange={(e) => setFormData({ ...formData, bestTimeToVisit: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Section 6: Amenities */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
                            <FiTag />
                            <span>Amenities & Highlights</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {AMENITY_OPTIONS.map((item) => {
                                const selected = formData.amenities.includes(item);
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => toggleAmenity(item)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                            selected
                                                ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                        }`}
                                    >
                                        {selected ? '✓ ' : '+ '}
                                        {item}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 transition-all flex items-center space-x-2 disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving Location...</span>
                                </>
                            ) : (
                                <>
                                    <FiCheck className="w-4 h-4" />
                                    <span>Save & Add Location</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPlaceModal;
