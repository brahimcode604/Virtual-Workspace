// État global de l'application
const appState = {
    employees: JSON.parse(localStorage.getItem('employees')) || [],
    unassigned: JSON.parse(localStorage.getItem('unassigned')) || [],
    zones: {
        'conference': JSON.parse(localStorage.getItem('zone_conference')) || [],
        'reception': JSON.parse(localStorage.getItem('zone_reception')) || [],
        'server': JSON.parse(localStorage.getItem('zone_server')) || [],
        'security': JSON.parse(localStorage.getItem('zone_security')) || [],
        'staff': JSON.parse(localStorage.getItem('zone_staff')) || [],
        'archives': JSON.parse(localStorage.getItem('zone_archives')) || []
    },
    zoneLimits: {
        'conference': 10,
        'reception': 2,
        'server': 3,
        'security': 2,
        'staff': 8,
        'archives': 2
    },



    zoneRestrictions: {
        'reception': ['receptionist', 'manager', 'cleaner'],
        'server': ['technician', 'manager'],
        'security': ['security', 'manager'],
        'archives': ['manager', 'developer', 'designer', 'receptionist', 'technician', 'security']
    }
};



// decumontaion__pr 1

// Regex pour validation
const validationRegex = {
    name: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
    phone: /^(?:(?:\+)212|0)\s*[567](?:[\s.-]*\d{2}){4}$/,
    photo: /^https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(?:\?.*)?$/i



};




// Génération d'ID unique
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}





// Validation des données employé
function validateEmployee(data) {
    const errors = [];

    if (!validationRegex.name.test(data.name)) {
        errors.push('Le nom doit contenir entre 2 et 50 caractères alphabétiques');
    }

    if (!validationRegex.email.test(data.email)) {
        errors.push('Format d\'email invalide');
    }

    if (data.phone && !validationRegex.phone.test(data.phone)) {
        errors.push('Format de téléphone invalide (ex: +212 6 23 45 67 89 ou 07 52 45 67 89)');
    }

    if (data.photo && !validationRegex.photo.test(data.photo)) {
        errors.push('L\'URL de la photo doit pointer vers une image valide');
    }

    if (!data.role) {
        errors.push('Le rôle est obligatoire');
    }

    return errors;
}

// Photo par défaut selon le rôle
function getDefaultPhoto(role) {
    const roleIcons = {
        'manager': 'fas fa-user-tie',
        'receptionist': 'fas fa-concierge-bell',
        'technician': 'fas fa-server',
        'security': 'fas fa-shield-alt',
        'cleaner': 'fas fa-broom',
        'developer': 'fas fa-code',
        'designer': 'fas fa-palette'
    };
    return roleIcons[role] || 'fas fa-user';
}

// Ajout d'un employé
function addEmployee(employeeData) {
    const errors = validateEmployee(employeeData);
    if (errors.length > 0) {
        showError(errors.join('\n'));
        return false;
    }

    const employee = {
        id: generateId(),
        name: employeeData.name.trim(),
        role: employeeData.role,
        photo: employeeData.photo || getDefaultPhoto(employeeData.role),
        email: employeeData.email,
        phone: employeeData.phone || '',
        experiences: employeeData.experiences || [],
        currentZone: null,
        createdAt: new Date().toISOString()
    };

    appState.employees.push(employee);
    appState.unassigned.push(employee.id);
    saveToStorage();
    renderUnassigned();
    showSuccess('Employé ajouté avec succès!');
    return true;
}

// Vérifier si un rôle peut être assigné à une zone
function canAssignToZone(role, zone) {
    // Manager peut aller partout
    if (role === 'manager') return true;

    // Nettoyage interdit aux archives
    if (role === 'cleaner' && zone === 'archives') return false;

    // Vérifier les restrictions spécifiques
    const restrictions = appState.zoneRestrictions[zone];
    if (restrictions) {
        return restrictions.includes(role);
    }

    // Pas de restrictions pour les autres zones
    return true;
}

// Assignation à une zone
function assignToZone(employeeId, zone) {
    const employee = appState.employees.find(emp => emp.id === employeeId);
    if (!employee) return false;

    // Vérifier si la zone est pleine
    if (appState.zones[zone].length >= appState.zoneLimits[zone]) {
        showError(`La zone ${getZoneName(zone)} est pleine (${appState.zoneLimits[zone]} max)`);
        return false;
    }

    // Vérifier les restrictions de rôle
    if (!canAssignToZone(employee.role, zone)) {
        showError(`${getRoleName(employee.role)} ne peut pas être assigné à ${getZoneName(zone)}`);
        return false;
    }

    // Retirer de l'ancienne zone si nécessaire
    if (employee.currentZone) {
        removeFromZone(employeeId, employee.currentZone, false);
    }

    // Ajouter à la nouvelle zone
    appState.zones[zone].push(employeeId);
    employee.currentZone = zone;

    // Retirer de la liste non assignée
    const unassignedIndex = appState.unassigned.indexOf(employeeId);
    if (unassignedIndex > -1) {
        appState.unassigned.splice(unassignedIndex, 1);
    }

    saveToStorage();
    renderUnassigned();
    renderZone(zone);
    updateZoneStyles();
    return true;
}

// Retirer d'une zone
function removeFromZone(employeeId, zone, showInUnassigned = true) {
    const zoneIndex = appState.zones[zone].indexOf(employeeId);
    if (zoneIndex > -1) {
        appState.zones[zone].splice(zoneIndex, 1);
    }

    const employee = appState.employees.find(emp => emp.id === employeeId);
    if (employee) {
        employee.currentZone = null;
        if (showInUnassigned && !appState.unassigned.includes(employeeId)) {
            appState.unassigned.push(employeeId);
        }
    }

    saveToStorage();
    renderZone(zone);
    renderUnassigned();
    updateZoneStyles();
}

// Rendu des employés non assignés
function renderUnassigned() {
    const container = document.getElementById('unassigned-staff');
    container.innerHTML = '';

    if (appState.unassigned.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-user-slash text-3xl mb-2"></i>
                <p>Aucun employé non assigné</p>
            </div>
        `;
        return;
    }

    appState.unassigned.forEach(employeeId => {
        const employee = appState.employees.find(emp => emp.id === employeeId);
        if (employee) {
            const card = createEmployeeCard(employee, true);
            container.appendChild(card);
        }
    });
}

// Rendu d'une zone spécifique
function renderZone(zone) {
    const container = document.querySelector(`[data-zone="${zone}"]`);
    if (!container) return;

    container.innerHTML = '';
    const countElement = container.closest('.rounded-xl').querySelector('.bg-gray-100');
    if (countElement) {
        countElement.textContent = `${appState.zones[zone].length}/${appState.zoneLimits[zone]}`;
    }

    appState.zones[zone].forEach(employeeId => {
        const employee = appState.employees.find(emp => emp.id === employeeId);
        if (employee) {
            const card = createEmployeeCard(employee, false);
            container.appendChild(card);
        }
    });
}

// Rendu de toutes les zones
function renderAllZones() {
    Object.keys(appState.zones).forEach(zone => {
        renderZone(zone);
    });
}

// Création d'une carte employé
function createEmployeeCard(employee, isUnassigned) {
    const card = document.createElement('div');
    card.className = 'employee-card bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer';
    card.setAttribute('data-employee-id', employee.id);
    card.draggable = true;

    const isIcon = employee.photo.includes('fas fa-');
    
    card.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
                ${isIcon ? 
                    `<div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <i class="${employee.photo} text-primary-600"></i>
                     </div>` :
                    `<img src="${employee.photo}" alt="${employee.name}" class="w-10 h-10 rounded-full object-cover">`
                }
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">${employee.name}</p>
                <p class="text-xs text-gray-500 capitalize">${getRoleName(employee.role)}</p>
            </div>
            ${!isUnassigned ? `
                <button class="remove-from-zone text-gray-400 hover:text-error-500 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        </div>
    `;

    // Événements
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-from-zone')) {
            showEmployeeProfile(employee);
        }
    });

    if (!isUnassigned) {
        const removeBtn = card.querySelector('.remove-from-zone');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromZone(employee.id, employee.currentZone, true);
        });
    }

    // Drag and Drop
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', employee.id);
        card.classList.add('opacity-50');
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('opacity-50');
    });

    return card;
}

// Affichage du profil employé
function showEmployeeProfile(employee) {
    const modal = document.getElementById('employee-profile-modal');
    const content = modal.querySelector('.p-6');
    
    const isIcon = employee.photo.includes('fas fa-');
    
    content.innerHTML = `
        <div class="text-center mb-6">
            ${isIcon ? 
                `<div class="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="${employee.photo} text-primary-600 text-3xl"></i>
                 </div>` :
                `<img src="${employee.photo}" alt="${employee.name}" class="w-24 h-24 rounded-full object-cover mx-auto mb-4">`
            }
            <h3 class="text-xl font-bold text-gray-900">${employee.name}</h3>
            <p class="text-primary-600 font-medium capitalize">${getRoleName(employee.role)}</p>
        </div>
        
        <div class="space-y-4">
            <div class="flex items-center space-x-3">
                <i class="fas fa-envelope text-gray-400 w-5"></i>
                <span class="text-gray-700">${employee.email}</span>
            </div>
            
            ${employee.phone ? `
            <div class="flex items-center space-x-3">
                <i class="fas fa-phone text-gray-400 w-5"></i>
                <span class="text-gray-700">${employee.phone}</span>
            </div>
            ` : ''}
            
            <div class="flex items-center space-x-3">
                <i class="fas fa-map-marker-alt text-gray-400 w-5"></i>
                <span class="text-gray-700">
                    ${employee.currentZone ? getZoneName(employee.currentZone) : 'Non assigné'}
                </span>
            </div>
            
            ${employee.experiences.length > 0 ? `
            <div>
                <h4 class="font-semibold text-gray-900 mb-2">Expériences professionnelles</h4>
                <ul class="space-y-1">
                    ${employee.experiences.map(exp => `<li class="text-sm text-gray-600">• ${exp}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        
        <div class="mt-6 pt-4 border-t border-gray-200">
            <button id="close-profile" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Fermer
            </button>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    document.getElementById('close-profile').addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });
}



// Mise à jour des styles des zones
function updateZoneStyles() {
    const zoneElements = document.querySelectorAll('[data-zone]');
    
    zoneElements.forEach(container => {
        const zone = container.getAttribute('data-zone');
        const zoneElement = container.closest('.rounded-xl');
        const isEmpty = appState.zones[zone].length === 0;
        
        // Zones obligatoires vides en rouge pâle (sauf conférence et personnel)
        const isMandatoryEmpty = isEmpty && !['conference', 'staff'].includes(zone);
        
        zoneElement.classList.remove('zone-empty', 'zone-occupied');
        zoneElement.classList.add(isMandatoryEmpty ? 'zone-empty' : 'zone-occupied');
        
        // Mettre à jour le compteur
        const countElement = zoneElement.querySelector('.bg-gray-100');
        if (countElement) {
            const isFull = appState.zones[zone].length >= appState.zoneLimits[zone];
            countElement.className = `text-sm px-2 py-1 rounded ${
                isFull ? 'bg-error-100 text-error-800' : 'bg-gray-100 text-gray-500'
            }`;
        }
    });
}

// Réorganisation automatique
function autoReorganize() {
    // Réinitialiser toutes les zones
    Object.keys(appState.zones).forEach(zone => {
        appState.zones[zone].forEach(employeeId => {
            removeFromZone(employeeId, zone, true);
        });
    });

    // Réassigner aléatoirement selon les règles
    const shuffledUnassigned = [...appState.unassigned].sort(() => Math.random() - 0.5);
    
    shuffledUnassigned.forEach(employeeId => {
        const employee = appState.employees.find(emp => emp.id === employeeId);
        if (employee) {
            const availableZones = Object.keys(appState.zones).filter(zone => 
                canAssignToZone(employee.role, zone) && 
                appState.zones[zone].length < appState.zoneLimits[zone]
            );
            
            if (availableZones.length > 0) {
                const randomZone = availableZones[Math.floor(Math.random() * availableZones.length)];
                assignToZone(employeeId, randomZone);
            }
        }
    });

    showSuccess('Réorganisation automatique effectuée!');
}

// Sauvegarde dans le localStorage
function saveToStorage() {
    localStorage.setItem('employees', JSON.stringify(appState.employees));
    localStorage.setItem('unassigned', JSON.stringify(appState.unassigned));
    Object.keys(appState.zones).forEach(zone => {
        localStorage.setItem(`zone_${zone}`, JSON.stringify(appState.zones[zone]));
    });
}

// Utilitaires
function getZoneName(zone) {
    const zoneNames = {
        'conference': 'Salle de Conférence',
        'reception': 'Réception',
        'server': 'Salle des Serveurs',
        'security': 'Salle de Sécurité',
        'staff': 'Salle du Personnel',
        'archives': 'Salle d\'Archives'
    };
    return zoneNames[zone] || zone;
}

function getRoleName(role) {
    const roleNames = {
        'manager': 'Manager',
        'receptionist': 'Réceptionniste',
        'technician': 'Technicien IT',
        'security': 'Agent de sécurité',
        'cleaner': 'Agent de nettoyage',
        'developer': 'Développeur',
        'designer': 'Designer'
    };
    return roleNames[role] || role;
}

function showError(message) {
    alert(`Erreur: ${message}`);
}

function showSuccess(message) {
    alert(`Succès: ${message}`);
}

// Modal d'assignation à une zone
function showZoneAssignmentModal(zone) {
    const eligibleEmployees = appState.unassigned.filter(employeeId => {
        const employee = appState.employees.find(emp => emp.id === employeeId);
        return employee && canAssignToZone(employee.role, zone);
    });

    if (eligibleEmployees.length === 0) {
        showError(`Aucun employé éligible pour la ${getZoneName(zone)}`);
        return;
    }

    let modalContent = `
        <h3 class="text-lg font-semibold mb-4">Assigner à ${getZoneName(zone)}</h3>
        <div class="space-y-2 max-h-60 overflow-y-auto">
    `;

    eligibleEmployees.forEach(employeeId => {
        const employee = appState.employees.find(emp => emp.id === employeeId);
        modalContent += `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-3">
                    ${employee.photo.includes('fas fa-') ? 
                        `<div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <i class="${employee.photo} text-primary-600"></i>
                         </div>` :
                        `<img src="${employee.photo}" alt="${employee.name}" class="w-8 h-8 rounded-full object-cover">`
                    }
                    <div>
                        <p class="font-medium">${employee.name}</p>
                        <p class="text-sm text-gray-500">${getRoleName(employee.role)}</p>
                    </div>
                </div>
                <button class="assign-employee-btn bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm" 
                        data-employee-id="${employee.id}" data-zone="${zone}">
                    Assigner
                </button>
            </div>
        `;
    });

    modalContent += `</div>
        <button class="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded close-zone-modal">
            Fermer
        </button>
    `;

    // Créer une modal temporaire
    const tempModal = document.createElement('div');
    tempModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    tempModal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            ${modalContent}
        </div>
    `;

    // Événements pour les boutons d'assignation
    tempModal.querySelectorAll('.assign-employee-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const employeeId = e.target.getAttribute('data-employee-id');
            const zone = e.target.getAttribute('data-zone');
            assignToZone(employeeId, zone);
            document.body.removeChild(tempModal);
        });
    });

    // Fermer la modal
    tempModal.querySelector('.close-zone-modal').addEventListener('click', () => {
        document.body.removeChild(tempModal);
    });

    document.body.appendChild(tempModal);
}

// Configuration des événements
function setupEventListeners() {
    // Gestion du formulaire
    document.getElementById('employee-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const experiences = Array.from(document.querySelectorAll('input[name="experiences[]"]'))
            .map(input => input.value.trim())
            .filter(exp => exp !== '');

        const employeeData = {
            name: formData.get('name'),
            role: formData.get('role'),
            photo: formData.get('photo'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            experiences: experiences
        };

        if (addEmployee(employeeData)) {
            e.target.reset();
            document.getElementById('photo-preview').classList.add('hidden');
            document.getElementById('photo-placeholder').classList.remove('hidden');
            document.getElementById('experiences-container').innerHTML = '';
            document.getElementById('add-employee-modal').classList.add('hidden');
            document.getElementById('add-employee-modal').classList.remove('flex');
        }
    });

    // Boutons d'ajout aux zones
    document.querySelectorAll('.add-to-zone').forEach(button => {
        button.addEventListener('click', (e) => {
            const zone = e.target.closest('.rounded-xl').querySelector('[data-zone]').getAttribute('data-zone');
            showZoneAssignmentModal(zone);
        });
    });

    // Drag and Drop pour les zones
    document.querySelectorAll('[data-zone]').forEach(zoneElement => {
        zoneElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            zoneElement.classList.add('bg-gray-50');
        });

        zoneElement.addEventListener('dragleave', () => {
            zoneElement.classList.remove('bg-gray-50');
        });

        zoneElement.addEventListener('drop', (e) => {
            e.preventDefault();
            zoneElement.classList.remove('bg-gray-50');
            const employeeId = e.dataTransfer.getData('text/plain');
            const zone = zoneElement.getAttribute('data-zone');
            assignToZone(employeeId, zone);
        });
    });

    // Réorganisation automatique
    document.querySelector('.bg-warning-500').addEventListener('click', () => {
        if (confirm('Voulez-vous réorganiser automatiquement tous les employés selon les règles métier?')) {
            autoReorganize();
        }
    });
}

// Événements de base pour les modales
document.getElementById('add-worker-btn').addEventListener('click', function() {
    document.getElementById('add-employee-modal').classList.remove('hidden');
    document.getElementById('add-employee-modal').classList.add('flex');
});

document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('add-employee-modal').classList.add('hidden');
    document.getElementById('add-employee-modal').classList.remove('flex');
});

document.getElementById('cancel-modal').addEventListener('click', function() {
    document.getElementById('add-employee-modal').classList.add('hidden');
    document.getElementById('add-employee-modal').classList.remove('flex');
});

// Gestion de la prévisualisation de photo
document.querySelector('input[name="photo"]').addEventListener('input', function(e) {
    const preview = document.getElementById('photo-preview');
    const placeholder = document.getElementById('photo-placeholder');
    
    if (e.target.value) {
        preview.src = e.target.value;
        preview.classList.remove('hidden');
        placeholder.classList.add('hidden');
    } else {
        preview.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }
});

// Ajout d'expériences dynamiques
document.getElementById('add-experience').addEventListener('click', function() {
    const container = document.getElementById('experiences-container');
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'experiences[]';
    input.placeholder = 'Ex: Développeur Front-End chez ABC (2020-2022)';
    input.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm';
    container.appendChild(input);
});

// Fermer les modales en cliquant à l'extérieur
document.addEventListener('click', function(e) {
    const addModal = document.getElementById('add-employee-modal');
    const profileModal = document.getElementById('employee-profile-modal');
    
    if (e.target === addModal) {
        addModal.classList.add('hidden');
        addModal.classList.remove('flex');
    }
    
    if (e.target === profileModal) {
        profileModal.classList.add('hidden');
        profileModal.classList.remove('flex');
    }
});

// Initialisation de l'application
function initApp() {
    renderUnassigned();
    renderAllZones();
    setupEventListeners();
    updateZoneStyles();
}

// Démarrer l'application
initApp();