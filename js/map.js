/**
 * Map Module
 * Gestion des cartes Leaflet
 */

const MapManager = {
    BRECEY_CENTER: [48.726, -1.166],
    ZOOM_LEVEL: 15,
    maps: {},
    tempMarkers: {},
    savedMarkers: {},
    
    /**
     * Crée une icône de marqueur colorée
     */
    createMarkerIcon(color, isTemp = false) {
        const tempClass = isTemp ? 'marker-temp' : '';
        return L.divIcon({
            className: 'custom-marker',
            html: `<div class="${tempClass}" style="
                background-color: ${color};
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            "></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });
    },
    
    /**
     * Initialise une carte
     */
    initMap(containerId) {
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            console.error('Container not found:', containerId);
            return null;
        }
        
        // Si la carte existe déjà, la supprimer proprement
        if (this.maps[containerId]) {
            try {
                this.maps[containerId].off();
                this.maps[containerId].remove();
            } catch(e) {
                console.log('Map cleanup error:', e);
            }
            this.maps[containerId] = null;
        }
        
        // Réinitialiser les marqueurs
        this.tempMarkers[containerId] = null;
        this.savedMarkers[containerId] = [];
        
        // Créer la carte avec les coordonnées de Brécey
        const map = L.map(containerId, {
            center: this.BRECEY_CENTER,
            zoom: this.ZOOM_LEVEL,
            zoomControl: true,
            attributionControl: false
        });
        
        // Ajouter les tuiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
        
        // Stocker la référence
        this.maps[containerId] = map;
        
        console.log('Map initialized:', containerId, 'Center:', this.BRECEY_CENTER);
        
        return map;
    },
    
    /**
     * Rafraîchit une carte et recentre sur Brécey
     */
    refreshMap(containerId) {
        const map = this.maps[containerId];
        if (map) {
            map.invalidateSize();
            map.setView(this.BRECEY_CENTER, this.ZOOM_LEVEL);
        }
    },
    
    /**
     * Ajoute un gestionnaire de clic sur la carte
     */
    onMapClick(containerId, color, callback) {
        const map = this.maps[containerId];
        if (!map) return;
        
        // Supprimer les anciens listeners
        map.off('click');
        
        map.on('click', (e) => {
            // Supprimer le marqueur temporaire précédent
            if (this.tempMarkers[containerId]) {
                map.removeLayer(this.tempMarkers[containerId]);
            }
            
            // Créer un nouveau marqueur temporaire
            const marker = L.marker(e.latlng, {
                icon: this.createMarkerIcon(color, true)
            }).addTo(map);
            
            this.tempMarkers[containerId] = marker;
            
            // Callback avec les coordonnées
            callback({
                lat: e.latlng.lat,
                lng: e.latlng.lng
            });
        });
    },
    
    /**
     * Confirme le marqueur temporaire (le rend permanent)
     */
    confirmTempMarker(containerId, color) {
        const map = this.maps[containerId];
        const tempMarker = this.tempMarkers[containerId];
        
        if (!map || !tempMarker) return null;
        
        const latlng = tempMarker.getLatLng();
        
        // Supprimer le marqueur temporaire
        map.removeLayer(tempMarker);
        this.tempMarkers[containerId] = null;
        
        // Créer un marqueur permanent
        const permanentMarker = L.marker(latlng, {
            icon: this.createMarkerIcon(color, false)
        }).addTo(map);
        
        this.savedMarkers[containerId].push(permanentMarker);
        
        return {
            marker: permanentMarker,
            lat: latlng.lat,
            lng: latlng.lng
        };
    },
    
    /**
     * Annule le marqueur temporaire
     */
    cancelTempMarker(containerId) {
        const map = this.maps[containerId];
        const tempMarker = this.tempMarkers[containerId];
        
        if (map && tempMarker) {
            map.removeLayer(tempMarker);
            this.tempMarkers[containerId] = null;
        }
    },
    
    /**
     * Supprime un marqueur sauvegardé par index
     */
    removeMarker(containerId, index) {
        const map = this.maps[containerId];
        const markers = this.savedMarkers[containerId];
        
        if (map && markers && markers[index]) {
            map.removeLayer(markers[index]);
            markers.splice(index, 1);
        }
    },
    
    /**
     * Efface tous les marqueurs d'une carte
     */
    clearMarkers(containerId) {
        const map = this.maps[containerId];
        const markers = this.savedMarkers[containerId];
        
        if (map && markers) {
            markers.forEach(marker => map.removeLayer(marker));
            this.savedMarkers[containerId] = [];
        }
        
        this.cancelTempMarker(containerId);
    },
    
    /**
     * Charge des marqueurs depuis les données sauvegardées
     */
    loadMarkers(containerId, markersData, color) {
        const map = this.maps[containerId];
        if (!map || !markersData) return;
        
        markersData.forEach(data => {
            const marker = L.marker([data.lat, data.lng], {
                icon: this.createMarkerIcon(color, false)
            }).addTo(map);
            this.savedMarkers[containerId].push(marker);
        });
    }
};
