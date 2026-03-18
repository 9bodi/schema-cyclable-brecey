/**
 * Storage Module
 * Gestion du stockage local et synchronisation
 */

const Storage = {
    STORAGE_KEY: 'schema_cyclable_brecey',
    PARTICIPANT_KEY: 'schema_cyclable_participant_id',
    
    /**
     * Génère un ID unique pour le participant
     */
    generateParticipantId() {
        return 'p_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Récupère ou crée l'ID du participant
     */
    getParticipantId() {
        let id = localStorage.getItem(this.PARTICIPANT_KEY);
        if (!id) {
            id = this.generateParticipantId();
            localStorage.setItem(this.PARTICIPANT_KEY, id);
        }
        return id;
    },
    
    /**
     * Récupère les données du participant courant
     */
    getCurrentData() {
        const allData = this.getAllContributions();
        const participantId = this.getParticipantId();
        return allData.find(d => d.participant_id === participantId) || this.createEmptyContribution();
    },
    
    /**
     * Crée une contribution vide
     */
    createEmptyContribution() {
        return {
            participant_id: this.getParticipantId(),
            timestamp_start: new Date().toISOString(),
            timestamp_end: null,
            etape_1_lieux: [],
            etape_2_points_noirs: [],
            etape_3_itineraires: {
                selections: [],
                autre: null
            },
            etape_4_opportunites: [],
            etape_5_priorite: {
                choix: null,
                autre: null
            }
        };
    },
    
    /**
     * Récupère toutes les contributions
     */
    getAllContributions() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Erreur lecture localStorage:', e);
            return [];
        }
    },
    
    /**
     * Sauvegarde les données du participant courant
     */
    saveCurrentData(data) {
        try {
            const allData = this.getAllContributions();
            const participantId = this.getParticipantId();
            const index = allData.findIndex(d => d.participant_id === participantId);
            
            data.participant_id = participantId;
            
            if (index >= 0) {
                allData[index] = data;
            } else {
                allData.push(data);
            }
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
            return true;
        } catch (e) {
            console.error('Erreur sauvegarde localStorage:', e);
            return false;
        }
    },
    
    /**
     * Marque la contribution comme terminée
     */
    finishContribution(data) {
        data.timestamp_end = new Date().toISOString();
        return this.saveCurrentData(data);
    },
    
    /**
     * Efface toutes les données (admin)
     */
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
    },
    
    /**
     * Réinitialise la contribution du participant courant
     */
    resetCurrentParticipant() {
        const allData = this.getAllContributions();
        const participantId = this.getParticipantId();
        const filtered = allData.filter(d => d.participant_id !== participantId);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
        // Génère un nouvel ID pour recommencer
        localStorage.removeItem(this.PARTICIPANT_KEY);
    }
};