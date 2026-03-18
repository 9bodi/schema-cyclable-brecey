/**
 * Export Utilities
 * Fonctions d'export CSV, JSON et capture d'image
 */

const ExportUtils = {
    
    /**
     * Exporte toutes les données en CSV
     */
    exportCSV(data) {
        const rows = [];
        
        // En-tête
        rows.push([
            'participant_id',
            'etape',
            'type',
            'latitude',
            'longitude',
            'categorie',
            'commentaire',
            'timestamp_start',
            'timestamp_end'
        ].join(';'));
        
        data.forEach(contribution => {
            const participantId = contribution.participant_id;
            const timestampStart = contribution.timestamp_start || '';
            const timestampEnd = contribution.timestamp_end || '';
            
            // Étape 1 - Lieux importants
            if (contribution.etape_1_lieux) {
                contribution.etape_1_lieux.forEach(lieu => {
                    rows.push([
                        participantId,
                        '1',
                        'lieu',
                        lieu.lat,
                        lieu.lng,
                        '',
                        `"${this.escapeCSV(lieu.pourquoi)}"`,
                        timestampStart,
                        timestampEnd
                    ].join(';'));
                });
            }
            
            // Étape 2 - Points noirs
            if (contribution.etape_2_points_noirs) {
                contribution.etape_2_points_noirs.forEach(point => {
                    rows.push([
                        participantId,
                        '2',
                        'point_noir',
                        point.lat,
                        point.lng,
                        `"${this.escapeCSV(point.type)}"`,
                        `"${this.escapeCSV(point.commentaire || '')}"`,
                        timestampStart,
                        timestampEnd
                    ].join(';'));
                });
            }
            
            // Étape 3 - Itinéraires
            if (contribution.etape_3_itineraires) {
                const selections = contribution.etape_3_itineraires.selections || [];
                selections.forEach(selection => {
                    rows.push([
                        participantId,
                        '3',
                        'itineraire',
                        '',
                        '',
                        `"${this.escapeCSV(selection)}"`,
                        '',
                        timestampStart,
                        timestampEnd
                    ].join(';'));
                });
                
                if (contribution.etape_3_itineraires.autre) {
                    rows.push([
                        participantId,
                        '3',
                        'itineraire_autre',
                        '',
                        '',
                        '',
                        `"${this.escapeCSV(contribution.etape_3_itineraires.autre)}"`,
                        timestampStart,
                        timestampEnd
                    ].join(';'));
                }
            }
            
            // Étape 4 - Opportunités
            if (contribution.etape_4_opportunites) {
                contribution.etape_4_opportunites.forEach(opp => {
                    rows.push([
                        participantId,
                        '4',
                        'opportunite',
                        opp.lat,
                        opp.lng,
                        '',
                        `"${this.escapeCSV(opp.description)}"`,
                        timestampStart,
                        timestampEnd
                    ].join(';'));
                });
            }
            
            // Étape 5 - Priorité
            if (contribution.etape_5_priorite && contribution.etape_5_priorite.choix) {
                rows.push([
                    participantId,
                    '5',
                    'priorite',
                    '',
                    '',
                    `"${this.escapeCSV(contribution.etape_5_priorite.choix)}"`,
                    `"${this.escapeCSV(contribution.etape_5_priorite.autre || '')}"`,
                    timestampStart,
                    timestampEnd
                ].join(';'));
            }
        });
        
        // Télécharger le fichier
        const csvContent = '\uFEFF' + rows.join('\n'); // BOM pour Excel
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(blob, `schema-cyclable-brecey-${this.getDateString()}.csv`);
    },
    
    /**
     * Exporte toutes les données en JSON
     */
    exportJSON(data) {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        this.downloadFile(blob, `schema-cyclable-brecey-${this.getDateString()}.json`);
    },
    
    /**
     * Capture la carte en image PNG
     */
    async captureMap(containerId) {
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            alert('Carte non trouvée');
            return;
        }
        
        try {
            // Afficher un message de chargement
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading';
            loadingDiv.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(loadingDiv);
            
            // Attendre un peu que les tuiles se chargent
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const canvas = await html2canvas(mapContainer, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 2 // Meilleure qualité
            });
            
            // Supprimer le chargement
            loadingDiv.remove();
            
            // Télécharger l'image
            canvas.toBlob((blob) => {
                this.downloadFile(blob, `carte-schema-cyclable-brecey-${this.getDateString()}.png`);
            }, 'image/png');
            
        } catch (error) {
            console.error('Erreur capture:', error);
            alert('Erreur lors de la capture. Essayez de faire une capture d\'écran manuelle.');
        }
    },
    
    /**
     * Télécharge un fichier
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    /**
     * Échappe les caractères pour CSV
     */
    escapeCSV(str) {
        if (!str) return '';
        return str.replace(/"/g, '""').replace(/\n/g, ' ');
    },
    
    /**
     * Retourne la date au format YYYY-MM-DD
     */
    getDateString() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }
};