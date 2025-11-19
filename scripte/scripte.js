
        
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
    