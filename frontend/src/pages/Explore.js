import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiMapPin, FiNavigation, FiPlus, FiCheckCircle } from 'react-icons/fi';
import PlaceCard from '../components/PlaceCard';
import MapView from '../components/MapView';
import AddPlaceModal from '../components/AddPlaceModal';
import { placesAPI } from '../utils/api';

const POPULAR_CITIES = [
    { id: '', name: 'All Cities' },
    { id: 'Bhubaneswar', name: 'Bhubaneswar' },
    { id: 'Puri', name: 'Puri' },
    { id: 'Cuttack', name: 'Cuttack' },
    { id: 'Konark', name: 'Konark' },
    { id: 'Chilika', name: 'Chilika' },
    { id: 'Sambalpur', name: 'Sambalpur' },
    { id: 'Gopalpur', name: 'Gopalpur' },
    { id: 'Rourkela', name: 'Rourkela' }
];

const Explore = ({ userLocation }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [places, setPlaces] = useState([]);
    const [categories, setCategories] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        sort: 'distance',
        minRating: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(searchParams.get('add') === 'true');
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            setIsAddModalOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadPlaces();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, userLocation, selectedCity]);

    const loadCategories = async () => {
        try {
            const res = await placesAPI.getCategories();
            setCategories(res.data.data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadPlaces = async () => {
        try {
            setLoading(true);
            const params = {
                lat: userLocation?.lat || 20.2961,
                lng: userLocation?.lng || 85.8245,
                radius: 500000,
                ...filters
            };
            delete params.category;
            delete params.sort;

            const res = await placesAPI.getNearby({
                ...params,
                category: filters.category || undefined,
                sort: filters.sort
            });

            let data = res.data?.data || [];

            // Client-side city filter if selected
            if (selectedCity) {
                data = data.filter(p => {
                    const placeCity = (p.location?.city || p.city || '').toLowerCase();
                    const targetCity = selectedCity.toLowerCase();
                    return placeCity.includes(targetCity) || (p.location?.address || '').toLowerCase().includes(targetCity);
                });
            }

            setPlaces(data);
        } catch (error) {
            console.error('Error loading places:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        if (key === 'category') {
            if (value) {
                searchParams.set('category', value);
            } else {
                searchParams.delete('category');
            }
            setSearchParams(searchParams);
        }
    };

    const handleCityChange = (cityId) => {
        setSelectedCity(cityId);
        if (cityId) {
            searchParams.set('city', cityId);
        } else {
            searchParams.delete('city');
        }
        setSearchParams(searchParams);
    };

    const handlePlaceAdded = (newPlace) => {
        // Prepend new place to list
        setPlaces(prev => [newPlace, ...prev]);
        setNotification(`Successfully added "${newPlace.name}" to Explore!`);
        setTimeout(() => setNotification(null), 4000);
    };

    return (
        <div className="min-h-screen pt-16 sm:pt-20 pb-8 sm:pb-12">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                {/* Notification Toast */}
                {notification && (
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex items-center justify-between animate-fadeIn">
                        <div className="flex items-center space-x-2">
                            <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-semibold text-sm">{notification}</span>
                        </div>
                        <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white text-xs">Dismiss</button>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Explore {selectedCity ? selectedCity : 'Odisha'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                            {places.length} places & attractions to discover
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* + Add Place Button */}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-500/20 hover:shadow-lg transition-all"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>Add Location</span>
                        </button>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-colors ${
                                showFilters
                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <FiFilter className="w-4 h-4" />
                            <span>Filters</span>
                        </button>

                        {/* View Toggle */}
                        <div className="flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                title="List View"
                                className={`px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1.5 transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-primary-500 text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <FiMapPin className="w-4 h-4" />
                                <span className="hidden sm:inline">Cards</span>
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                title="Map View"
                                className={`px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1.5 transition-colors ${
                                    viewMode === 'map'
                                        ? 'bg-primary-500 text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <FiNavigation className="w-4 h-4" />
                                <span className="hidden sm:inline">Map</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* City Selection Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-hide">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-1 flex-shrink-0">
                        Destination:
                    </span>
                    {POPULAR_CITIES.map(city => (
                        <button
                            key={city.id}
                            onClick={() => handleCityChange(city.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                selectedCity === city.id
                                    ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-sm shadow-primary-500/30 font-semibold'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {city.name}
                        </button>
                    ))}
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 mb-5 shadow-lg border border-gray-100 dark:border-gray-700/60 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Category Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Category
                                </label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                >
                                    <option value="">All Categories</option>
                                    {categories?.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Sort By
                                </label>
                                <select
                                    value={filters.sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                >
                                    <option value="distance">Nearest First</option>
                                    <option value="rating">Highest Rated</option>
                                    <option value="popularity">Most Popular</option>
                                </select>
                            </div>

                            {/* Rating Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Minimum Rating
                                </label>
                                <select
                                    value={filters.minRating}
                                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                >
                                    <option value="">Any Rating</option>
                                    <option value="4.5">4.5+ Stars</option>
                                    <option value="4">4.0+ Stars</option>
                                    <option value="3">3.0+ Stars</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Category Pills */}
                <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
                    <button
                        onClick={() => handleFilterChange('category', '')}
                        className={`px-4 py-2 rounded-xl whitespace-nowrap text-xs font-medium transition-all ${
                            !filters.category
                                ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/25 font-semibold'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                    >
                        All Categories
                    </button>
                    {categories?.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleFilterChange('category', cat.id)}
                            className={`px-4 py-2 rounded-xl whitespace-nowrap text-xs font-medium transition-all flex items-center space-x-1.5 ${
                                filters.category === cat.id
                                    ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/25 font-semibold'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="spinner mb-3"></div>
                        <p className="text-sm text-gray-500">Loading places...</p>
                    </div>
                ) : viewMode === 'map' ? (
                    <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700">
                        <MapView
                            places={places}
                            userLocation={userLocation}
                            height="620px"
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {places?.map(place => (
                            <PlaceCard key={place._id || place.id} place={place} showDistance={true} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && places.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 max-w-lg mx-auto">
                        <div className="w-14 h-14 mx-auto rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-500 mb-3 text-2xl">
                            📍
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No places found in this selection</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">
                            Be the first to add a location here or adjust your filters!
                        </p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>Add New Location</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Add Place Modal */}
            <AddPlaceModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    if (searchParams.get('add')) {
                        searchParams.delete('add');
                        setSearchParams(searchParams);
                    }
                }}
                onPlaceAdded={handlePlaceAdded}
                initialLocation={userLocation}
            />
        </div>
    );
};

export default Explore;