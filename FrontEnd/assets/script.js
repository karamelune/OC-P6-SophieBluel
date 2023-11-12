// Récupération des éléments du DOM
const portfolio = document.getElementById('portfolio');
const gallery = document.querySelector('.gallery');

// Ensemble catégories uniques et carte correspondance catégorie-identifiant
const categoryNames = new Set();
const categoryMap = {};

// Création d'un fragment pour éviter les reflows
const fragmentProjects = new DocumentFragment();

// Création de l'élément de filtres
const filters = document.createElement('div');
filters.setAttribute('id', 'filters')
portfolio.insertBefore(filters, gallery);

// Création du bouton "Tous"
const allBtn = createFilterButton('Tous', filterGallery);
filters.appendChild(allBtn);

// Récupération des projets depuis l'API
async function fetchProjects() {
    try {
        const response = await fetch('http://localhost:5678/api/works');
        const data = await response.json();

        // Ajout du nom de catégorie à l'ensemble et création d'une figure pour chaque projet
        data.forEach(item => {
            categoryNames.add(item.category.name);
            categoryMap[item.category.name] = item.categoryId;

            const figure = document.createElement('figure');
            figure.classList.add(`category-${item.categoryId}`);

            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.alt = item.title;

            const figcaption = document.createElement('figcaption');
            figcaption.textContent = item.title;

            figure.appendChild(img);
            figure.appendChild(figcaption);

            fragmentProjects.appendChild(figure);
        });

        // Ajout du fragment à la galerie après la boucle
        gallery.appendChild(fragmentProjects);

        // Création d'un bouton de filtre pour chaque catégorie
        categoryNames.forEach(category => {
            const filterBtn = createFilterButton(category, () => filterGallery(categoryMap[category]));
            filters.appendChild(filterBtn);
        });

        // Affichage de tous les éléments par défaut
        filterGallery();
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Fonction pour créer un bouton de filtre
function createFilterButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.classList.add('filter');

    // Le bouton "Tous" est actif par défaut
    if (text === 'Tous') {
        btn.classList.add('filter-active');
    }

    // Au clic d'un bouton, mise à jour de la classe active, puis filtrage
    btn.addEventListener('click', function() {
        removeActiveClass();
        this.classList.add('filter-active');
        onClick();
    });

    return btn;
}

// Fonction pour retirer la classe active du bouton actuellement actif
function removeActiveClass() {
    // Récupération du bouton actif
    const activeBtn = document.querySelector('.filter-active');
    // Si un bouton actif existe, retrait de la classe 'filter-active'
    if (activeBtn) {
        activeBtn.classList.remove('filter-active');
    }
}

// Fonction pour filtrer la galerie en fonction de l'identifiant de la catégorie
function filterGallery(categoryId) {
    // Récupération de tous les éléments de la galerie
    const figures = gallery.querySelectorAll('figure');
    // Ajout de la classe 'hidden' à tous les éléments
    figures.forEach(figure => {
        figure.classList.add('hidden');
    });

    // Si aucun identifiant, affichage de tous les éléments
    if (!categoryId) {
        figures.forEach(figure => {
            figure.classList.remove('hidden');
        });
        // Et ajout de la classe 'filter-active' au bouton "Tous"
        allBtn.classList.add('filter-active');
        return;
    }

    // Récupération des éléments de la galerie correspondant à la catégorie
    const filteredFigures = gallery.querySelectorAll(`.category-${categoryId}`);
    // Suppression de la classe 'hidden'
    filteredFigures.forEach(figure => {
        figure.classList.remove('hidden');
    });
}

// Appel de la fonction pour récupérer les projets
fetchProjects();