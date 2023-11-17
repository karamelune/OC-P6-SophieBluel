// On initialise les éléments du DOM nécessaires pour le script
const portfolio = document.getElementById('portfolio');
const gallery = portfolio.querySelector('.gallery');
const [loginBtn, adminBanner, editBtn] = ['loginBtn', 'adminBanner', 'editBtn'].map((id) =>
	document.getElementById(id)
);

// On crée les variables nécessaires pour stocker les projets et les informations de catégories
let projects = [];
let categories = [];
let categoryMap = {};
const fragmentProjects = new DocumentFragment();

// On crée les boutons de filtres
const filters = document.createElement('div');
filters.id = 'filters';
filters.appendChild(createFilterButton('Tous', filterGallery));

async function fetchCategories() {
	try {
		const response = await fetch('http://localhost:5678/api/categories');
		if (!response.ok) {
			throw new Error(`Erreur HTTP: ${response.status}`);
		}
		const data = await response.json();
		data.forEach(({ name, id: categoryId }) => {
			categoryMap[categoryId] = name;
		});
	} catch (error) {
		console.error('Erreur lors de la récupération des catégories:', error);
	}
}

async function fetchAndAddProjects() {
	try {
		const response = await fetch('http://localhost:5678/api/works');
		if (!response.ok) {
			throw new Error(`Erreur HTTP: ${response.status}`);
		}
		const data = await response.json();
		data.forEach((item) => {
			addProjectToArray('projectId', item.id, item);
		});
	} catch (error) {
		console.error('Erreur lors de la récupération des projets:', error);
	}
}

function addProjectToArray(idType, id, data) {
	const { categoryId, imageUrl, title } = data;
	const categoryName = categoryMap[categoryId];
	const project = {
		category: { name: categoryName, id: categoryId },
		id: idType === 'newProjectId' ? id : data.id,
		imageUrl,
		title,
	};
	projects.push(project);
}

function addProjectToDOM(project, element) {
	const {
		id: projectId,
		category: { id: categoryId },
		imageUrl,
		title,
	} = project;

	// Vérifiez si un élément avec l'id du projet existe déjà
	if (!document.getElementById(projectId)) {
		const figure = document.createElement('figure');
		figure.id = projectId; // Ajout de l'id au projet
		figure.classList.add(`category-${categoryId}`);

		const img = document.createElement('img');
		img.src = imageUrl;
		img.alt = title;
		figure.appendChild(img);

		const figcaption = document.createElement('figcaption');
		figcaption.textContent = title;
		figure.appendChild(figcaption);

		element.appendChild(figure);
	}
}

function addProjectsToDOM(projects) {
	projects.forEach((project) => {
		addProjectToDOM(project, fragmentProjects);
	});

	gallery.appendChild(fragmentProjects);
}

function addNewProjectToDOM(newProject) {
	addProjectToDOM(newProject, gallery);
}

async function createFilters() {
	try {
		// Create an array of all unique categories in 'projects'
		categories = [...new Set(projects.map((project) => project.category.name))];

		// Create a filter button for each category
		const filterFragment = document.createDocumentFragment();
		categories.forEach((category) => {
			const categoryFilterId = projects.find((project) => project.category.name === category).category.id;
			categoryMap[category] = categoryFilterId;
			filterFragment.appendChild(createFilterButton(category, categoryFilterId));
		});

		// Add 'filters' to the DOM element of the page
		portfolio.insertBefore(filters, gallery);

		// Add the filter fragment to the 'filters' div
		filters.appendChild(filterFragment);

		// Filter the projects to only display what matches the active filter
		filterGallery();
	} catch (error) {
		console.error('Error during filter creation:', error);
	}
}

function createFilterButton(text, categoryFilterId) {
	const btn = document.createElement('button');
	btn.textContent = text;
	btn.className = text === 'Tous' ? 'filter filter-active' : 'filter';

	btn.addEventListener('click', function () {
		document.querySelector('.filter-active')?.classList.remove('filter-active');
		this.classList.add('filter-active');
		activeBtn = this;
		filterGallery(categoryFilterId);
	});

	return btn;
}

let activeBtn =
	gallery.querySelector('.filter') ||
	Array.from(gallery.querySelectorAll('button')).find((btn) => btn.textContent === 'Tous') ||
	document.createElement('button');

function filterGallery(categoryId) {
	const figures = gallery.querySelectorAll('figure');
	if (activeBtn.textContent === 'Tous' || categoryId === undefined) {
		figures.forEach((figure) => {
			figure.classList.remove('hidden');
		});
	} else {
		figures.forEach((figure) => {
			if (figure.classList.contains(`category-${categoryId}`)) {
				figure.classList.remove('hidden');
			} else {
				figure.classList.add('hidden');
			}
		});
	}
}

async function main() {
	await fetchCategories();
	await fetchAndAddProjects();
	addProjectsToDOM(projects);
	createFilters(projects);
}

main();

/********* ADMIN *********/

// Récupération du token stocké
const token = localStorage.getItem('token');
if (token) {
	// Changer le texte du bouton de connexion / déconnexion
	loginBtn.textContent = 'logout';
	loginBtn.href = '#';
	// Ajouter un événement de clic au bouton de connexion/déconnexion
	loginBtn.onclick = () => {
		// Enlever le token du localstorage et rafraîchir la page
		localStorage.removeItem('token');
		location.reload();
	};

	// Cacher les filtres de la galerie et afficher le mode administrateur
	filters.style.display = 'none';
	filterGallery();
	displayAdminMode();
}

// Afficher le mode admin
function displayAdminMode() {
	try {
		adminBanner.classList.replace('hidden', 'flex');
		editBtn.classList.remove('hidden');
		editBtn.addEventListener('click', displayEditModale);
	} catch (error) {
		console.error("Erreur lors de l'affichage du mode administrateur:", error);
	}
}

// Afficher la modale d'édition
function displayEditModale() {
	try {
		const editModale = document.querySelector('#editModale');
		const modaleGallery = editModale.querySelector('#modaleGallery');

		const existingImages = new Set(Array.from(modaleGallery.querySelectorAll('img')).map((img) => img.src));

		// Parcourir les projets et ajouter ceux qui n'ont pas encore été ajoutés à la modale
		projects.forEach((project) => {
			if (!existingImages.has(project.imageUrl)) {
				const figure = document.createElement('figure');
				figure.classList.add(`category-${project.categoryId}`);
				figure.dataset.projectId = project.id;

				const img = document.createElement('img');
				img.src = project.imageUrl;
				img.alt = project.title;
				figure.appendChild(img);

				// Ajouter une icône de corbeille pour supprimer le projet
				const trashCan = document.createElement('div');
				trashCan.id = 'trashCan';
				const trashCanIcon = document.createElement('i');
				trashCanIcon.classList.add('fa-solid', 'fa-trash-can');
				trashCan.addEventListener('click', () => deleteProject(project.id).catch(console.error));
				trashCan.appendChild(trashCanIcon);
				figure.appendChild(trashCan);

				modaleGallery.appendChild(figure);
			}
		});

		// Supprimer la classe 'hidden' pour afficher la modale et ajouter un événement de clic pour la fermer
		editModale.classList.remove('hidden');
		editModale.addEventListener('click', (event) => {
			if (
				!editModale.querySelector('.editModale-content').contains(event.target) ||
				editModale.querySelector('.close').contains(event.target)
			) {
				editModale.classList.add('hidden');
			}
		});

		// Ajouter la classe 'hidden' à addPhotoModale si celle-ci ne l'a pas déjà
		if (!addPhotoModale.classList.contains('hidden')) {
			addPhotoModale.classList.add('hidden');
		}

		const addPhotoButton = editModale.querySelector('input[type="submit"]');
		addPhotoButton.addEventListener('click', (event) => {
			event.preventDefault();
			displayAddPhotoModale();
			// Fermer la modale d'édition
			editModale.classList.add('hidden');
		});
	} catch (error) {
		console.error("Erreur lors de l'affichage de la modale d'édition:", error);
	}
}

// Afficher la modale d'ajout de photo
const formImageInput = document.querySelector('#formImageInput');
const image = document.querySelector('#image');
const imagePreview = document.querySelector('#imagePreview');

function displayAddPhotoModale() {
	try {
		const addPhotoModale = document.querySelector('#addPhotoModale');
		const categorySelect = addPhotoModale.querySelector('#category');
		categories.forEach((categoryName) => {
			// On vérifie si l'option n'existe pas déjà
			if (!Array.from(categorySelect.options).find((option) => String(option.value) === String(categoryName))) {
				// On crée une nouvelle option
				const option = document.createElement('option');

				// On définit la valeur et le texte de l'option
				option.value = categoryName;
				option.textContent = categoryName;

				// On ajoute l'option au sélecteur de catégories
				categorySelect.appendChild(option);
			}
		});

		addPhotoModale.classList.remove('hidden');

		const modalContentClickCheck = (event, element) => {
			let modalContent = addPhotoModale.querySelector('.addPhotoModale-content');
			return !modalContent.contains(event.target) || element.contains(event.target);
		};

		addPhotoModale.addEventListener('click', (event) => {
			if (modalContentClickCheck(event, addPhotoModale.querySelector('.close')))
				addPhotoModale.classList.add('hidden');
		});

		// Ajouter un bouton pour revenir à la modale d'édition
		addPhotoModale.querySelector('.fa-arrow-left').addEventListener('click', () => {
			addPhotoModale.classList.add('hidden');
			document.querySelector('#editModale').classList.remove('hidden');
		});
	} catch (error) {
		console.error("Erreur lors de l'affichage de la modale d'ajout de photo:", error);
	}
}

async function deleteProject(projectId) {
	try {
		// Envoyer une requête DELETE à l'API pour supprimer le projet
		const response = await fetch(`http://localhost:5678/api/works/${projectId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});
		if (!response.ok) {
			throw new Error(`Erreur HTTP: ${response.status}`);
		}

		// Supprimer le projet du tableau 'projects'
		projects = projects.filter((project) => project.id !== projectId);

		// Sélection de la modale et de sa galerie
		const modale = document.querySelector('#editModale');
		const modaleGallery = modale.querySelector('#modaleGallery');

		// Recherche de l'élément à supprimer
		const figureToRemove = modaleGallery.querySelector(`[data-project-id="${projectId}"]`);

		// Si l'élément existe, le supprimer. Sinon, afficher une erreur
		figureToRemove ? figureToRemove.remove() : console.error('Element à supprimer introuvable');
	} catch (error) {
		console.error('Erreur lors de la suppression du projet:', error);
	}
}

document.getElementById('addPhotoForm').addEventListener('submit', function (event) {
	event.preventDefault();

	let formData = new FormData();
	formData.append('image', document.getElementById('image').files[0]);
	formData.append('title', document.getElementById('title').value);

	// Récupérez le nom de la catégorie sélectionné
	let selectedCategoryName = document.getElementById('category').value;

	// Utilisez categoryMap pour obtenir l'ID de la catégorie correspondant au nom de la catégorie sélectionné
	let selectedCategoryId = categoryMap[selectedCategoryName];

	// Utilisez l'ID de la catégorie obtenu pour remplir le FormData
	formData.append('category', selectedCategoryId);

	fetch('http://localhost:5678/api/works', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	})
		.then((response) => {
			if (!response.ok) {
				switch (response.status) {
					case 400:
						throw new Error('Erreur 400 : Mauvaise requête');
					case 401:
						throw new Error('Erreur 401 : Non autorisé');
					case 500:
						throw new Error('Erreur 500 : Erreur interne du serveur');
					default:
						throw new Error("Erreur lors de l'envoi du formulaire");
				}
			}
			return response.json();
		})
		.then((data) => {
			const newProjectId = data.id;
			addProjectToArray('newProjectId', newProjectId, data);
			addNewProjectToDOM(projects[projects.length - 1]);
			filterGallery();
			displayEditModale();
			event.target.reset();
			imagePreview.src = '';
			Array.from(formImageInput.children).forEach((child) => {
				child.classList.remove('hidden');
			});
		})
		.catch((error) => {
			console.error('Erreur:', error);
			alert(error.message);
		});
});

formImageInput.ondragover = formImageInput.ondragenter = function (event) {
	event.preventDefault();
};

function handleFileChange(file) {
	const reader = new FileReader();
	reader.onload = function (event) {
		imagePreview.src = event.target.result;
		Array.from(formImageInput.children).forEach((child) => {
			if (child.id !== 'imagePreview') {
				child.classList.add('hidden');
			}
		});
	};
	reader.readAsDataURL(file);
}

formImageInput.ondrop = function (event) {
	event.preventDefault();
	image.files = event.dataTransfer.files;
	const file = event.dataTransfer.files[0];
	handleFileChange(file);
};

image.addEventListener('change', function (event) {
	const file = event.target.files[0];
	handleFileChange(file);
});

const inputs = document.querySelectorAll('#addPhotoForm input, #addPhotoForm select');
inputs.forEach((input) => {
	input.addEventListener('input', function () {
		const allFilled = Array.from(inputs).every((input) => input.value !== '');
		document.querySelector('#addPhotoForm input[type="submit"]').disabled = !allFilled;
	});
});
