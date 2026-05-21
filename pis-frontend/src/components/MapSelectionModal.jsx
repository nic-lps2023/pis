import React, { useEffect, useState, useRef } from "react";

const MapSelectionModal = ({ isOpen, onClose, onLocationSelect, initialLat, initialLng }) => {
  const [selectedLat, setSelectedLat] = useState(initialLat || "");
  const [selectedLng, setSelectedLng] = useState(initialLng || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Load Leaflet library
  useEffect(() => {
    if (!isOpen) return;

    // Check if Leaflet is already loaded
    if (window.L) {
      setMapLoaded(true);
      setTimeout(() => initializeMap(), 100);
    } else {
      // Load Leaflet CSS
      const cssLink = document.createElement("link");
      cssLink.rel = "stylesheet";
      cssLink.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(cssLink);

      // Load Leaflet JS
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = () => {
        setMapLoaded(true);
        setTimeout(() => initializeMap(), 100);
      };
      script.onerror = () => {
        console.error("Failed to load Leaflet library");
        alert("Failed to load map library. Please try again.");
      };
      document.head.appendChild(script);
    }
  }, [isOpen]);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;

    const defaultLat = initialLat ? parseFloat(initialLat) : 24.817;
    const defaultLng = initialLng ? parseFloat(initialLng) : 93.9368;

    try {
      // Create map
      const map = window.L.map(mapRef.current).setView([defaultLat, defaultLng], 13);

      // Add tile layer
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add existing marker if coordinates provided
      if (initialLat && initialLng) {
        const marker = window.L.marker([parseFloat(initialLat), parseFloat(initialLng)]).addTo(map);
        marker.bindPopup("Selected Location");
        markerRef.current = marker;
      }

      // Add click listener to map
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLat(lat);
        setSelectedLng(lng);

        // Remove old marker if exists
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        // Add new marker
        const newMarker = window.L.marker([lat, lng]).addTo(map);
        newMarker.bindPopup(`<strong>Selected Location</strong><br/>Lat: ${lat.toFixed(6)}<br/>Lng: ${lng.toFixed(6)}`).openPopup();
        markerRef.current = newMarker;
      });

      // Make map responsive - fix display issue
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } catch (error) {
      console.error("Error initializing map:", error);
      alert("Error initializing map. Please refresh and try again.");
    }
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a location to search");
      return;
    }

    if (!mapInstanceRef.current) {
      alert("Map is not loaded yet. Please wait a moment and try again.");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      console.log("Searching for location:", searchQuery);

      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Primary search with more detailed parameters
      const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=10&addressdetails=1&extratags=1`;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'PIS-Permit-Application/1.0',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      console.log("Search results received:", results.length);

      if (results && results.length > 0) {
        // Process results to show more relevant ones first
        const processedResults = results.map((result, index) => ({
          id: index,
          name: result.name || result.display_name.split(',')[0],
          display_name: result.display_name,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          type: result.type,
          importance: result.importance || 0
        }));

        // Sort by importance and relevance
        processedResults.sort((a, b) => b.importance - a.importance);

        setSearchResults(processedResults);
        setShowResults(true);

        console.log(`Found ${processedResults.length} locations`);
      } else {
        // Try with simplified query (just first word) if no results
        const firstWord = searchQuery.split(' ')[0];
        if (firstWord !== searchQuery) {
          console.log("No results, trying with first word:", firstWord);
          const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(firstWord)}&format=json&limit=10&addressdetails=1`;
          
          const fallbackResponse = await fetch(fallbackUrl, {
            headers: {
              'User-Agent': 'PIS-Permit-Application/1.0',
              'Accept': 'application/json'
            },
            mode: 'cors'
          });

          if (fallbackResponse.ok) {
            const fallbackResults = await fallbackResponse.json();
            if (fallbackResults && fallbackResults.length > 0) {
              const processedResults = fallbackResults.map((result, index) => ({
                id: index,
                name: result.name || result.display_name.split(',')[0],
                display_name: result.display_name,
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon),
                type: result.type,
                importance: result.importance || 0
              }));
              setSearchResults(processedResults);
              setShowResults(true);
              return;
            }
          }
        }

        alert(`Location "${searchQuery}" not found. \n\nTips:\n- Try searching by main place name (e.g., "Thoubal", "Imphal")\n- Use district or city name for better results\n- Or click on the map to select location directly\n- You can use coordinates (lat, lon) format`);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert(`Search error: ${error.message}\n\nPlease try:\n- Simplifying your search\n- Using a different place name\n- Clicking directly on the map`);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (result) => {
    const { lat, lon, display_name } = result;
    
    setSelectedLat(lat);
    setSelectedLng(lon);

    // Pan to location
    mapInstanceRef.current.setView([lat, lon], 15);

    // Remove old marker if exists
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
    }

    // Add new marker
    const marker = window.L.marker([lat, lon]).addTo(mapInstanceRef.current);
    marker.bindPopup(`<strong>${display_name}</strong><br/>Lat: ${lat.toFixed(6)}<br/>Lng: ${lon.toFixed(6)}`).openPopup();
    markerRef.current = marker;

    // Close results panel
    setShowResults(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleConfirm = () => {
    if (!selectedLat || !selectedLng) {
      alert("Please select a location on the map");
      return;
    }
    onLocationSelect(selectedLat, selectedLng);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal d-block"
      style={{
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 1050,
      }}
    >
      <div
        className="modal-dialog modal-lg"
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          margin: "5vh auto",
        }}
      >
        <div className="modal-content" style={{ height: "80vh", display: "flex", flexDirection: "column" }}>
          <div className="modal-header">
            <h5 className="modal-title">Select Location on Map</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
            ></button>
          </div>

          <div className="modal-body" style={{ flex: 1, padding: "15px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="mb-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search location (e.g., 'Thoubal Mela Ground', 'Delhi', '28.6139, 77.2090')..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(false);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchLocation();
                    }
                  }}
                  disabled={isSearching}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={handleSearchLocation}
                  disabled={isSearching}
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div style={{
                  marginTop: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ padding: "8px 0" }}>
                    <p style={{ margin: "8px 15px 0px 15px", fontSize: "0.85rem", color: "#666" }}>
                      Found {searchResults.length} location(s). Click to select:
                    </p>
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => selectLocation(result)}
                        style={{
                          padding: "10px 15px",
                          borderBottom: "1px solid #eee",
                          cursor: "pointer",
                          backgroundColor: "#fff",
                          transition: "backgroundColor 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
                      >
                        <div style={{ fontWeight: "500", fontSize: "0.95rem", marginBottom: "3px" }}>
                          {result.name}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "3px" }}>
                          {result.display_name.length > 70 ? result.display_name.substring(0, 70) + "..." : result.display_name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#999" }}>
                          Lat: {result.lat.toFixed(6)} | Lon: {result.lon.toFixed(6)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ color: "#666", fontSize: "0.9rem", marginBottom: "10px" }}>
              <strong>Instructions:</strong> Search for a location, select from results, or click on the map to mark a location.
            </div>

            <div
              ref={mapRef}
              style={{
                width: "100%",
                flex: 1,
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            ></div>

            <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
              <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>
                <strong>Selected Coordinates:</strong> Lat: {selectedLat ? parseFloat(selectedLat).toFixed(6) : "Not selected"} | Lng: {selectedLng ? parseFloat(selectedLng).toFixed(6) : "Not selected"}
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={!selectedLat || !selectedLng}
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapSelectionModal;
