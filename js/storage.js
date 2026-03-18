// Configuration Supabase
const SUPABASE_URL = 'https://wtvfyoqagabofvzzlibd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0dmZ5b3FhZ2Fib2Z2enpsaWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDk1NzMsImV4cCI6MjA4OTQyNTU3M30.QjrySAyNlive-AldjxaS6zivALXICQlVrubnyCgqwFc';

const Storage = {
    STORAGE_KEY: 'schema_cyclable_brecey',

    // Génère un ID unique pour le participant
    generateParticipantId() {
        return 'participant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Récupère ou crée les données du participant actuel
    getCurrentData() {
        let data = localStorage.getItem(this.STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
        // Nouvelles données
        return {
            participant_id: this.generateParticipantId(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            etape1_lieux: [],
            etape2_points_noirs: [],
            etape3_itineraires: [],
            etape4_opportunites: [],
            etape5_priorite: null,
            submitted: false
        };
    },

    // Sauvegarde en local
    saveData(data) {
        data.updated_at = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        console.log('Data saved locally', data);
    },

    // Envoie à Supabase
    async syncToSupabase(data) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/contributions`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    participant_id: data.participant_id,
                    data: data
                })
            });

            if (response.ok) {
                console.log('✅ Data synced to Supabase');
                return true;
            } else {
                const error = await response.text();
                console.error('❌ Supabase sync failed:', error);
                return false;
            }
        } catch (error) {
            console.error('❌ Network error:', error);
            return false;
        }
    },

    // Récupère toutes les contributions depuis Supabase (pour admin)
    async getAllContributions() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/contributions?select=*&order=created_at.desc`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });

            if (response.ok) {
                const contributions = await response.json();
                console.log('✅ Fetched contributions from Supabase:', contributions.length);
                return contributions;
            } else {
                console.error('❌ Failed to fetch contributions');
                return [];
            }
        } catch (error) {
            console.error('❌ Network error:', error);
            return [];
        }
    },

    // Soumission finale : sauvegarde local + sync Supabase
    async submitFinal(data) {
        data.submitted = true;
        data.submitted_at = new Date().toISOString();
        this.saveData(data);
        
        // Sync to Supabase
        const synced = await this.syncToSupabase(data);
        return synced;
    },

    // Réinitialise les données locales (nouveau questionnaire)
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Data reset');
    },

    // Récupère toutes les contributions locales (fallback)
    getAllLocalContributions() {
        const contributions = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.STORAGE_KEY)) {
                try {
                    contributions.push(JSON.parse(localStorage.getItem(key)));
                } catch (e) {
                    console.error('Error parsing contribution', e);
                }
            }
        }
        return contributions;
    }
};
