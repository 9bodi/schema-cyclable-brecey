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
    
    /**
     * Initialise l'application
     */
    init() {
        // Éviter double init
        if (this.initialized) return;
        this.initialized = true;
        
        console.log('App initializing...');
        
        // Charger les données
        this.data = Storage.getCurrentData();
        
        // Attacher les événements
        this.attachEventListeners();
        
        // Afficher étape 1
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
        document.getElementById('modify-responses')?.addEventListener('click', () => this.restartForm());
        
        // Étape 1
        document.getElementById('add-marker-1')?.addEventListener('click', () => this.addLieu());
        
        // Étape 2
        document.getElementById('add-marker-2')?.addEventListener('click', () => this.addPointNoir());
        
        // Étape 4
        document.getElementById('add-marker-4')?.addEventListener('click', () => this.addOpportunite());
        
        // Étape 3 - validation
        document.querySelectorAll('input[name="itineraire"]').forEach(cb => {
            cb.addEventListener('change', () => this.updateButtonState(3));
        });
        document.getElementById('other-itineraire')?.addEventListener('input', () => this.updateButtonState(3));
        
        // Étape 5
        document.querySelectorAll('input[name="priorite"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const otherGroup = document.getElementById('other-priority-group');
                otherGroup.style.display = e.target.value === 'Autre' ? 'block' : 'none';
                this.updateButtonState(5);
            });
        });
        document.getElementById('other-priority')?.addEventListener('input', () => this.updateButtonState(5));
    },
    
    /**
     * Met à jour l'état du bouton
     */
    updateButtonState(stepNumber) {
        let btn, isValid = false;
        
        switch(stepNumber) {
            case 1:
                btn = document.getElementById('next-1');
                isValid = this.data.etape1_lieux.length > 0;
                break;
            case 2:
                btn = document.getElementById('next-2');
                isValid = this.data.etape2_points_noirs.length > 0;
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
                const selected = document.querySelector('input[name="priorite"]:checked');
                if (selected) {
                    isValid = selected.value !== 'Autre' || document.getElementById('other-priority')?.value.trim() !== '';
                }
                break;
        }
        
        if (btn) {
            btn.disabled = !isValid;
            btn.classList.toggle('btn-disabled', !isValid);
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
        
        // Masquer toutes les étapes
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
            step.style.display = 'none';
        });
        
        // Afficher l'étape courante
        const stepElement = document.getElementById(`step-${stepNumber}`);
        if (stepElement) {
            stepElement.style.display = 'block';
            stepElement.classList.add('active');
        }
        
        // Mettre à jour la progression
        this.currentStep = stepNumber;
        document.getElementById('current-step').textContent = stepNumber;
        document.getElementById('progress-fill').style.width = `${(stepNumber / this.totalSteps) * 100}%`;
        
        // Charger les données
        this.loadStepData(stepNumber);
        
        // Initialiser la carte si nécessaire (avec délai pour que le DOM soit prêt)
        if ([1, 2, 4].includes(stepNumber)) {
            setTimeout(() => this.initStepMap(stepNumber), 200);
        }
        
        // Mettre à jour le bouton
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
        
        // Vérifier que le conteneur a une taille
        const rect = container.getBoundingClientRect();
        console.log('Container size:', rect.width, 'x', rect.height);
        
        if (rect.width === 0 || rect.height === 0) {
            console.log('Container not visible yet, retrying...');
            setTimeout(() => this.initStepMap(stepNumber), 100);
            return;
        }
        
        // Initialiser la carte
        const map = MapManager.initMap(containerId);
        if (!map) return;
        
        // Centrer sur Brécey après un court délai
        setTimeout(() => {
            map.invalidateSize();
            map.setView(MapManager.BRECEY_CENTER, MapManager.ZOOM_LEVEL);
            console.log('Map centered on Brécey');
            
            // Configurer les événements
            this.setupMapEvents(stepNumber, containerId);
            this.loadMarkersForStep(stepNumber);
        }, 100);
    },
    
    /**
     * Configure les événements de la carte
     */
    setupMapEvents(stepNumber, containerId) {
        const colors = { 1: '#3B82F6', 2: '#EF4444', 4: '#F59E0B' };
        const inputGroups = { 1: 'input-group-1', 2: 'input-group-2', 4: 'input-group-4' };
        const focusFields = { 1: 'comment-1', 2: 'problem-type', 4: 'comment-4' };
        
        MapManager.onMapClick(containerId, colors[stepNumber], (coords) => {
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
            4: { data: this.data.etape4_opportunites, color: '#F59E0B' }
        };
        
        const config = configs[stepNumber];
        if (config && config.data.length > 0) {
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
                this.renderMarkersList(2, this.data.etape2_points_noirs, 'point-noir');
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
                const choix = this.data.etape5_priorite?.choix;
                if (choix) {
                    const radio = document.querySelector(`input[name="priorite"][value="${choix}"]`);
                    if (radio) {
                        radio.checked = true;
                        if (choix === 'Autre') {
                            document.getElementById('other-priority-group').style.display = 'block';
                            document.getElementById('other-priority').value = this.data.etape5_priorite.autre || '';
                        }
                    }
                }
                break;
        }
    },
    
    /**
     * Affiche la liste des marqueurs
     */
    renderMarkersList(stepNumber, items, itemClass) {
        const container = document.getElementById(`markers-list-${stepNumber}`);
        if (!container) return;
        
        if (!items || items.length === 0) {
            container.innerHTML = '<p class="no-markers">Aucun point ajouté. Cliquez sur la carte.</p>';
            return;
        }
        
        const icons = { 'lieu': '🔵', 'point-noir': '🔴', 'opportunite': '🟡' };
        
        container.innerHTML = items.map((item, index) => {
            let text = item.pourquoi || item.description || item.type;
            if (itemClass === 'point-noir' && item.commentaire) {
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
            2: { array: 'etape2_points_noirs', class: 'point-noir' },
            4: { array: 'etape4_opportunites', class: 'opportunite' }
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
     * Ajoute un point noir (étape 2)
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
        
        const result = MapManager.confirmTempMarker('map-2', '#EF4444');
        if (!result) return;
        
        this.data.etape2_points_noirs.push({ lat: result.lat, lng: result.lng, type, commentaire: comment });
        Storage.saveData(this.data);
        this.renderMarkersList(2, this.data.etape2_points_noirs, 'point-noir');
        this.updateButtonState(2);
        
        document.getElementById('problem-type').value = '';
        document.getElementById('comment-2').value = '';
        document.getElementById('input-group-2').style.display = 'none';
        this.tempCoords[2] = null;
        this.showToast('Point noir ajouté !');
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
     * Sauvegarde étape 3
     */
    saveStep3() {
        const selections = Array.from(document.querySelectorAll('input[name="itineraire"]:checked')).map(cb => cb.value);
        const autre = document.getElementById('other-itineraire')?.value.trim();
        this.data.etape3_itineraires = { selections, autre: autre || null };
        Storage.saveData(this.data);
    },
    
    /**
     * Sauvegarde étape 5
     */
    saveStep5() {
        const selected = document.querySelector('input[name="priorite"]:checked');
        const autre = document.getElementById('other-priority')?.value.trim();
        this.data.etape5_priorite = {
            choix: selected?.value || null,
            autre: selected?.value === 'Autre' ? autre : null
        };
        Storage.saveData(this.data);
    },
    
    /**
     * Soumet le formulaire avec sync Supabase
     */
    async submitForm() {
        // Validation étape 5
        const prioritySelected = document.querySelector('input[name="priorite"]:checked');
        if (!prioritySelected) {
            this.showToast('Veuillez sélectionner une priorité', 'error');
            return;
        }

        this.saveStep5();

        // Soumission avec sync Supabase
        const submitBtn = document.getElementById('submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Envoi en cours...';
        submitBtn.disabled = true;

        const synced = await Storage.submitFinal(this.data);

        // Masquer toutes les étapes
        document.querySelectorAll('.step').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });

        // Afficher écran de fin
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
     * Recommence
     */
    restartForm() {
        if (confirm('Voulez-vous vraiment recommencer ?')) {
            Storage.reset();
            this.data = Storage.getCurrentData();
            this.initialized = false;
            document.querySelector('.progress-container').style.display = 'flex';
            
            // Réinitialiser les cartes
            MapManager.maps = {};
            MapManager.markers = {};
            MapManager.tempMarkers = {};
            
            this.showStep(1);
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

// Démarrage
document.addEventListener('DOMContentLoaded', () => App.init());
