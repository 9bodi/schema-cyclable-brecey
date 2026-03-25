/**
 * Main Application
 * Schéma Cyclable Brécey - Questionnaire
 */

const App = {
    currentStep: 1,
    totalSteps: 5,
    data: null,
    tempCoords: {},
    initialized: false,
    
    // Configuration des limites par étape
    limits: {
        1: { min: 1, max: 3 },
        2: { min: 1, max: 3 },
        4: { min: 0, max: 3 },  // Optionnel
        5: { min: 1, max: 3 }
    },
    
    /**
     * Initialise l'application
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        console.log('App initializing...');
        
        this.data = Storage.getCurrentData();
        this.attachEventListeners();
        this.showStep(1);
        
        console.log('App initialized', this.data);
    },
    
    /**
     * Attache tous les gestionnaires d'événements
     */
    attachEventListeners() {
        // Navigation entre étapes
        document.getElementById('next-1')?.addEventListener('click', () => this.goToNextStep(1));
        document.getElementById('next-2')?.addEventListener('click', () => this.goToNextStep(2));
        document.getElementById('next-3')?.addEventListener('click', () => this.goToNextStep(3));
        document.getElementById('next-4')?.addEventListener('click', () => this.goToNextStep(4));
        document.getElementById('submit')?.addEventListener('click', () => this.submitForm());
        
        // Étape 1
        document.getElementById('add-marker-1')?.addEventListener('click', () => this.addLieu());
        
        // Étape 2
        document.getElementById('add-marker-2')?.addEventListener('click', () => this.addPointNoir());
        
        // Étape 4
        document.getElementById('add-marker-4')?.addEventListener('click', () => this.addOpportunite());
        
        // Étape 5
        document.getElementById('add-marker-5')?.addEventListener('click', () => this.addStationnement());
        
        // Étape 3 - validation
        document.querySelectorAll('input[name="itineraire"]').forEach(cb => {
            cb.addEventListener('change', () => this.updateButtonState(3));
        });
        document.getElementById('other-itineraire')?.addEventListener('input', () => this.updateButtonState(3));
    },
    
    /**
     * Vérifie si un doublon existe
     */
    isDuplicate(stepNumber, text) {
        const arrays = {
            1: this.data.etape1_lieux,
            2: this.data.etape2_points_noirs,
            4: this.data.etape4_opportunites,
            5: this.data.etape5_stationnements
        };
        
        const arr = arrays[stepNumber];
        if (!arr) return false;
        
        const normalizedText = text.toLowerCase().trim();
        
        return arr.some(item => {
            const itemText = (item.pourquoi || item.commentaire || item.description || '').toLowerCase().trim();
            return itemText === normalizedText;
        });
    },
    
    /**
     * Vérifie si le max est atteint
     */
    isMaxReached(stepNumber) {
        const arrays = {
            1: this.data.etape1_lieux,
            2: this.data.etape2_points_noirs,
            4: this.data.etape4_opportunites,
            5: this.data.etape5_stationnements
        };
        
        const arr = arrays[stepNumber];
        const limit = this.limits[stepNumber];
        
        return arr && limit && arr.length >= limit.max;
    },
    
    /**
     * Met à jour l'état du bouton
     */
    updateButtonState(stepNumber) {
        let btn, isValid = false;
        
        switch(stepNumber) {
            case 1:
                btn = document.getElementById('next-1');
                isValid = this.data.etape1_lieux.length >= this.limits[1].min;
                break;
            case 2:
                btn = document.getElementById('next-2');
                isValid = this.data.etape2_points_noirs.length >= this.limits[2].min;
                break;
            case 3:
                btn = document.getElementById('next-3');
                const checked = document.querySelectorAll('input[name="itineraire"]:checked').length > 0;
                const autre = document.getElementById('other-itineraire')?.value.trim() !== '';
                isValid = checked || autre;
                break;
            case 4:
                btn = document.getElementById('next-4');
                isValid = true; // Optionnel
                break;
            case 5:
                btn = document.getElementById('submit');
                isValid = this.data.etape5_stationnements.length >= this.limits[5].min;
                break;
        }
        
        if (btn) {
            btn.disabled = !isValid;
            btn.classList.toggle('btn-disabled', !isValid);
        }
        
        // Mise à jour de l'affichage du formulaire si max atteint
        this.updateInputVisibility(stepNumber);
    },
    
    /**
     * Cache le formulaire d'ajout si max atteint
     */
    updateInputVisibility(stepNumber) {
        if (![1, 2, 4, 5].includes(stepNumber)) return;
        
        const inputGroup = document.getElementById(`input-group-${stepNumber}`);
        if (!inputGroup) return;
        
        if (this.isMaxReached(stepNumber)) {
            inputGroup.style.display = 'none';
            MapManager.cancelTempMarker(`map-${stepNumber}`);
            this.tempCoords[stepNumber] = null;
        }
    },
    
    /**
     * Passe à l'étape suivante
     */
    goToNextStep(currentStep) {
        if (currentStep === 3) this.saveStep3();
        this.showStep(currentStep + 1);
    },
    
    /**
     * Affiche une étape
     */
    showStep(stepNumber) {
        console.log('Showing step:', stepNumber);
        
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
            step.style.display = 'none';
        });
        
        const stepElement = document.getElementById(`step-${stepNumber}`);
        if (stepElement) {
            stepElement.style.display = 'block';
            stepElement.classList.add('active');
        }
        
        this.currentStep = stepNumber;
        document.getElementById('current-step').textContent = stepNumber;
        document.getElementById('progress-fill').style.width = `${(stepNumber / this.totalSteps) * 100}%`;
        
        this.loadStepData(stepNumber);
        
        if ([1, 2, 4, 5].includes(stepNumber)) {
            setTimeout(() => this.initStepMap(stepNumber), 200);
        }
        
        setTimeout(() => this.updateButtonState(stepNumber), 100);
    },
    
    /**
     * Initialise la carte
     */
    initStepMap(stepNumber) {
        const containerId = `map-${stepNumber}`;
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }
        
        const rect = container.getBoundingClientRect();
        console.log('Container size:', rect.width, 'x', rect.height);
        
        if (rect.width === 0 || rect.height === 0) {
            console.log('Container not visible yet, retrying...');
            setTimeout(() => this.initStepMap(stepNumber), 100);
            return;
        }
        
        const map = MapManager.initMap(containerId);
        if (!map) return;
        
        setTimeout(() => {
            map.invalidateSize();
            map.setView(MapManager.BRECEY_CENTER, MapManager.ZOOM_LEVEL);
            console.log('Map centered on Brécey');
            
            this.setupMapEvents(stepNumber, containerId);
            this.loadMarkersForStep(stepNumber);
        }, 100);
    },
    
    /**
     * Configure les événements de la carte
     */
    setupMapEvents(stepNumber, containerId) {
        const colors = { 1: '#3B82F6', 2: '#EF4444', 4: '#F59E0B', 5: '#10B981' };
        const inputGroups = { 1: 'input-group-1', 2: 'input-group-2', 4: 'input-group-4', 5: 'input-group-5' };
        const focusFields = { 1: 'comment-1', 2: 'problem-type', 4: 'comment-4', 5: 'comment-5' };
        
        MapManager.onMapClick(containerId, colors[stepNumber], (coords) => {
            // Vérifier si max atteint
            if (this.isMaxReached(stepNumber)) {
                this.showToast(`Maximum ${this.limits[stepNumber].max} points atteint`);
                MapManager.cancelTempMarker(containerId);
                return;
            }
            
            this.tempCoords[stepNumber] = coords;
            document.getElementById(inputGroups[stepNumber]).style.display = 'block';
            document.getElementById(focusFields[stepNumber])?.focus();
        });
    },
    
    /**
     * Charge les marqueurs existants
     */
    loadMarkersForStep(stepNumber) {
        const configs = {
            1: { data: this.data.etape1_lieux, color: '#3B82F6' },
            2: { data: this.data.etape2_points_noirs, color: '#EF4444' },
            4: { data: this.data.etape4_opportunites, color: '#F59E0B' },
            5: { data: this.data.etape5_stationnements, color: '#10B981' }
        };
        
        const config = configs[stepNumber];
        if (config && config.data && config.data.length > 0) {
            MapManager.loadMarkers(`map-${stepNumber}`, config.data, config.color);
        }
    },
    
    /**
     * Charge les données d'une étape
     */
    loadStepData(stepNumber) {
        switch(stepNumber) {
            case 1:
                this.renderMarkersList(1, this.data.etape1_lieux, 'lieu');
                break;
            case 2:
                this.renderMarkersList(2, this.data.etape2_points_noirs, 'securite');
                break;
            case 3:
                const sel = this.data.etape3_itineraires.selections || [];
                document.querySelectorAll('input[name="itineraire"]').forEach(cb => {
                    cb.checked = sel.includes(cb.value);
                });
                const otherField = document.getElementById('other-itineraire');
                if (otherField) otherField.value = this.data.etape3_itineraires.autre || '';
                break;
            case 4:
                this.renderMarkersList(4, this.data.etape4_opportunites, 'opportunite');
                break;
            case 5:
                this.renderMarkersList(5, this.data.etape5_stationnements, 'stationnement');
                break;
        }
    },
    
    /**
     * Affiche la liste des marqueurs
     */
    renderMarkersList(stepNumber, items, itemClass) {
        const container = document.getElementById(`markers-list-${stepNumber}`);
        if (!container) return;
        
        const limit = this.limits[stepNumber];
        const countText = limit ? ` (${items?.length || 0}/${limit.max})` : '';
        
        if (!items || items.length === 0) {
            container.innerHTML = `<p class="no-markers">Aucun point ajouté. Cliquez sur la carte.${countText}</p>`;
            return;
        }
        
        const icons = { 
            'lieu': '🔵', 
            'securite': '🔴', 
            'opportunite': '🟡',
            'stationnement': '🟢'
        };
        
        container.innerHTML = `<p class="markers-count">${items.length}/${limit?.max || '∞'} point(s)</p>` + 
            items.map((item, index) => {
            let text = item.pourquoi || item.description || item.type;
            if (itemClass === 'securite' && item.commentaire) {
                text = `${item.type} - ${item.commentaire}`;
            }
            return `
                <div class="marker-item ${itemClass}">
                    <span class="marker-icon">${icons[itemClass]}</span>
                    <span class="marker-text">${text}</span>
                    <button class="marker-delete" onclick="App.deleteMarker(${stepNumber}, ${index})">&times;</button>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Supprime un marqueur
     */
    deleteMarker(stepNumber, index) {
        const configs = {
            1: { array: 'etape1_lieux', class: 'lieu' },
            2: { array: 'etape2_points_noirs', class: 'securite' },
            4: { array: 'etape4_opportunites', class: 'opportunite' },
            5: { array: 'etape5_stationnements', class: 'stationnement' }
        };
        
        const config = configs[stepNumber];
        this.data[config.array].splice(index, 1);
        MapManager.removeMarker(`map-${stepNumber}`, index);
        this.renderMarkersList(stepNumber, this.data[config.array], config.class);
        Storage.saveData(this.data);
        this.updateButtonState(stepNumber);
        this.showToast('Point supprimé');
    },
    
    /**
     * Ajoute un lieu (étape 1)
     */
    addLieu() {
        const comment = document.getElementById('comment-1').value.trim();
        
        if (!this.tempCoords[1]) {
            this.showToast('Cliquez d\'abord sur la carte');
            return;
        }
        if (!comment) {
            this.showToast('Expliquez pourquoi ce lieu est important');
            return;
        }
        if (this.isDuplicate(1, comment)) {
            this.showToast('Cette réponse existe déjà');
            return;
        }
        if (this.isMaxReached(1)) {
            this.showToast('Maximum 3 points atteint');
            return;
        }
        
        const result = MapManager.confirmTempMarker('map-1', '#3B82F6');
        if (!result) return;
        
        this.data.etape1_lieux.push({ lat: result.lat, lng: result.lng, pourquoi: comment });
        Storage.saveData(this.data);
        this.renderMarkersList(1, this.data.etape1_lieux, 'lieu');
        this.updateButtonState(1);
        
        document.getElementById('comment-1').value = '';
        document.getElementById('input-group-1').style.display = 'none';
        this.tempCoords[1] = null;
        this.showToast('Lieu ajouté !');
    },
    
    /**
     * Ajoute un point de sécurité (étape 2)
     */
    addPointNoir() {
        const type = document.getElementById('problem-type').value;
        const comment = document.getElementById('comment-2').value.trim();
        
        if (!this.tempCoords[2]) {
            this.showToast('Cliquez d\'abord sur la carte');
            return;
        }
        if (!type) {
            this.showToast('Sélectionnez un type de problème');
            return;
        }
        if (this.isMaxReached(2)) {
            this.showToast('Maximum 3 points atteint');
            return;
        }
        
        const result = MapManager.confirmTempMarker('map-2', '#EF4444');
        if (!result) return;
        
        this.data.etape2_points_noirs.push({ lat: result.lat, lng: result.lng, type, commentaire: comment });
        Storage.saveData(this.data);
        this.renderMarkersList(2, this.data.etape2_points_noirs, 'securite');
        this.updateButtonState(2);
        
        document.getElementById('problem-type').value = '';
        document.getElementById('comment-2').value = '';
        document.getElementById('input-group-2').style.display = 'none';
        this.tempCoords[2] = null;
        this.showToast('Point ajouté !');
    },
    
    /**
     * Ajoute une opportunité (étape 4)
     */
    addOpportunite() {
        const desc = document.getElementById('comment-4').value.trim();
        
        if (!this.tempCoords[4]) {
            this.showToast('Cliquez d\'abord sur la carte');
            return;
        }
        if (!desc) {
            this.showToast('Décrivez cette opportunité');
            return;
        }
        if (this.isDuplicate(4, desc)) {
            this.showToast('Cette réponse existe déjà');
            return;
        }
        if (this.isMaxReached(4)) {
            this.showToast('Maximum 3 points atteint');
            return;
        }
        
        const result = MapManager.confirmTempMarker('map-4', '#F59E0B');
        if (!result) return;
        
        this.data.etape4_opportunites.push({ lat: result.lat, lng: result.lng, description: desc });
        Storage.saveData(this.data);
        this.renderMarkersList(4, this.data.etape4_opportunites, 'opportunite');
        this.updateButtonState(4);
        
        document.getElementById('comment-4').value = '';
        document.getElementById('input-group-4').style.display = 'none';
        this.tempCoords[4] = null;
        this.showToast('Opportunité ajoutée !');
    },
    
    /**
     * Ajoute un stationnement (étape 5)
     */
    addStationnement() {
        const comment = document.getElementById('comment-5').value.trim();
        
        if (!this.tempCoords[5]) {
            this.showToast('Cliquez d\'abord sur la carte');
            return;
        }
        if (!comment) {
            this.showToast('Expliquez pourquoi cet emplacement');
            return;
        }
        if (this.isDuplicate(5, comment)) {
            this.showToast('Cette réponse existe déjà');
            return;
        }
        if (this.isMaxReached(5)) {
            this.showToast('Maximum 3 points atteint');
            return;
        }
        
        const result = MapManager.confirmTempMarker('map-5', '#10B981');
        if (!result) return;
        
        this.data.etape5_stationnements.push({ lat: result.lat, lng: result.lng, pourquoi: comment });
        Storage.saveData(this.data);
        this.renderMarkersList(5, this.data.etape5_stationnements, 'stationnement');
        this.updateButtonState(5);
        
        document.getElementById('comment-5').value = '';
        document.getElementById('input-group-5').style.display = 'none';
        this.tempCoords[5] = null;
        this.showToast('Stationnement ajouté !');
    },
    
    /**
     * Sauvegarde étape 3
     */
    saveStep3() {
        const selections = Array.from(document.querySelectorAll('input[name="itineraire"]:checked')).map(cb => cb.value);
        const autre = document.getElementById('other-itineraire')?.value.trim();
        this.data.etape3_itineraires = { selections, autre: autre || null };
        Storage.saveData(this.data);
    },
    
    /**
     * Soumet le formulaire avec sync Supabase
     */
    async submitForm() {
        if (this.data.etape5_stationnements.length < this.limits[5].min) {
            this.showToast('Ajoutez au moins un stationnement souhaité', 'error');
            return;
        }

        const submitBtn = document.getElementById('submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Envoi en cours...';
        submitBtn.disabled = true;

        const synced = await Storage.submitFinal(this.data);

        document.querySelectorAll('.step').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });

        const endScreen = document.getElementById('step-end');
        if (endScreen) {
            endScreen.style.display = 'flex';
            endScreen.classList.add('active');
        }
        document.querySelector('.progress-container').style.display = 'none';

        if (synced) {
            this.showToast('Merci ! Votre contribution a été enregistrée.', 'success');
        } else {
            this.showToast('Contribution enregistrée localement', 'warning');
        }
    },
    
    /**
     * Toast notification
     */
    showToast(message, type = 'info') {
        document.querySelector('.toast')?.remove();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
