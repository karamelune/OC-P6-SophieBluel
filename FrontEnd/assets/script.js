// Initialisation des éléments du DOM nécessaires pour le script
const portfolio = document.getElementById('portfolio');
const gallery = portfolio.querySelector('.gallery');
const [loginBtn, adminBanner, editBtn] = ['loginBtn', 'adminBanner', 'editBtn'].map((id) =>
	document.getElementById(id)
);
const photoFormError = document.querySelector('#addPhotoForm .error');

// Création des variables nécessaires pour stocker les projets et les informations de catégories
let projects = [];
let categoryMap = {};
let categoryNames;
const fragmentProjects = new DocumentFragment();

// Création des boutons de filtres
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

function addProjectToArray(isNewProject, id, data) {
	const { categoryId, imageUrl, title } = data;
	const categoryName = categoryMap[categoryId];
	const project = {
		category: { name: categoryName, id: categoryId },
		id: isNewProject ? id : data.id,
		imageUrl,
		title,
	};
	projects.push(project);
}

function createFigureElement(projectId, categoryId) {
	const figure = document.createElement('figure');
	figure.id = 'p' + projectId;
	figure.classList.add(`category-${categoryId}`);
	return figure;
}

function createImageElement(imageUrl, title) {
	const img = document.createElement('img');
	img.src = imageUrl;
	img.alt = title;
	return img;
}

function createFigcaptionElement(title) {
	const figcaption = document.createElement('figcaption');
	figcaption.textContent = title;
	return figcaption;
}

function addProjectToDOM(project, element) {
	const {
		id: projectId,
		category: { id: categoryId },
		imageUrl,
		title,
	} = project;

	if (!document.getElementById(projectId)) {
		const figure = createFigureElement(projectId, categoryId);
		figure.appendChild(createImageElement(imageUrl, title));
		figure.appendChild(createFigcaptionElement(title));
		element.appendChild(figure);
	}
}

function addProjectArrayToDOM(projects) {
	projects.forEach((project) => {
		addProjectToDOM(project, fragmentProjects);
	});
	gallery.appendChild(fragmentProjects);
}

async function createFilters() {
	try {
		// Création d'un tableau contenant les noms de catégories sans doublons
		categoryNames = new Set(Object.values(categoryMap));

		// Création d'un bouton de filtre pour chaque catégorie
		const filterFragment = document.createDocumentFragment();
		categoryNames.forEach((categoryName) => {
			const categoryFilterId = Object.keys(categoryMap).find(
				(key) => categoryMap[key] === categoryName
			);
			filterFragment.appendChild(createFilterButton(categoryName, categoryFilterId));
		});

		// Ajout des filtres avant la galerie
		portfolio.insertBefore(filters, gallery);

		// Ajout des filtres dans le DOM
		filters.appendChild(filterFragment);

		// Filtrer la galerie en fonction du bouton actif
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
	projects.forEach((project) => {
		addProjectToDOM(project, fragmentProjects);
	});
	gallery.appendChild(fragmentProjects);
	createFilters(projects);
}

main();

/********* ADMIN *********/

// Récupération du token stocké
const token = localStorage.getItem('token');
if (token) {
	// Changement du texte du bouton de connexion / déconnexion
	loginBtn.textContent = 'logout';
	loginBtn.href = '#';
	// Ajout d'un événement de clic au bouton de connexion/déconnexion
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

		const existingImages = new Set(
			Array.from(modaleGallery.querySelectorAll('img')).map((img) => img.src)
		);

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
				trashCan.addEventListener('click', () =>
					deleteProject(project.id).catch(console.error)
				);
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
const deleteImagePreview = document.querySelector('#deleteImagePreview');

function displayAddPhotoModale() {
	try {
		const addPhotoModale = document.querySelector('#addPhotoModale');
		const categorySelect = addPhotoModale.querySelector('#category');
		Array.from(categoryNames).forEach((categoryName) => {
			// On vérifie si l'option n'existe pas déjà
			if (
				!Array.from(categorySelect.options).find((option) => option.value === categoryName)
			) {
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

// Supprimer un projet
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

		// Recherche de l'élément à supprimer dans la modale
		const figureToRemoveInModale = modaleGallery.querySelector(
			`[data-project-id="${projectId}"]`
		);

		// Si l'élément existe dans la modale, le supprimer. Sinon, afficher une erreur
		figureToRemoveInModale
			? figureToRemoveInModale.remove()
			: console.error('Element à supprimer introuvable dans la modale');

		// Recherche de l'élément à supprimer dans la galerie principale
		const figureToRemoveInGallery = gallery.querySelector(`#p${projectId}`);

		// Si l'élément existe dans la galerie principale, le supprimer. Sinon, afficher une erreur
		figureToRemoveInGallery
			? figureToRemoveInGallery.remove()
			: console.error('Element à supprimer introuvable dans la galerie principale');
	} catch (error) {
		console.error('Erreur lors de la suppression du projet:', error);
	}
}

// Ajouter un projet
document.getElementById('addPhotoForm').addEventListener('submit', function (event) {
	event.preventDefault();

	let formData = new FormData();
	formData.append('image', document.getElementById('image').files[0]);
	formData.append('title', document.getElementById('title').value);

	let selectedCategoryName = document.getElementById('category').value;
	let selectedCategoryId = Object.keys(categoryMap).find(
		(key) => categoryMap[key] === selectedCategoryName
	);
	if (selectedCategoryId === undefined) {
		throw new Error(`Erreur: Catégorie "${selectedCategoryName}" non trouvée`);
	}

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
			addProjectToArray(true, newProjectId, data);
			const newProject = projects[projects.length - 1];
			addProjectToDOM(newProject, gallery);
			filterGallery();
			displayEditModale();
			event.target.reset();
			imagePreview.src = '';
			Array.from(formImageInput.children).forEach((child) => {
				child.classList.remove('hidden');
			});
			deleteImagePreview.classList.add('hidden');
		})
		.catch((error) => {
			console.error('Erreur:', error);
			alert(error.message);
		});
});

// Afficher l'image sélectionnée
function handleFileChange(event) {
	photoFormError.textContent = '';

	const file = event.target.files[0];
	const fileName = file.name;
	const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
	const maxSize = 4 * 1024 * 1024; // 4Mo en bytes

	if (!allowedExtensions.exec(fileName)) {
		photoFormError.textContent = 'Seuls les fichiers JPG, JPEG et PNG sont autorisés.';
		image.value = null;
		return;
	}

	if (file.size > maxSize) {
		photoFormError.textContent = 'La taille du fichier ne doit pas dépasser 4Mo.';
		image.value = null;
		return;
	}

	const reader = new FileReader();
	reader.onload = function (event) {
		imagePreview.src = event.target.result;
		deleteImagePreview.classList.remove('hidden');
	};
	reader.readAsDataURL(file);
}

// Afficher l'image sélectionnée lors d'un changement de fichier
image.addEventListener('change', handleFileChange);

// Supprimer l'image sélectionnée
deleteImagePreview.addEventListener('click', function () {
	imagePreview.src = '';
	image.value = null;
	deleteImagePreview.classList.add('hidden');
});

// Drag and drop
formImageInput.ondragover = formImageInput.ondragenter = function (event) {
	event.preventDefault();
};

// Afficher l'image sélectionnée lors d'un drag and drop
formImageInput.ondrop = function (event) {
	event.preventDefault();
	const file = event.dataTransfer.files[0];
	handleFileChange({ target: { files: [file] } });
};

// Vérifier que tous les champs sont remplis avant d'activer le bouton d'envoi
const inputs = document.querySelectorAll('#addPhotoForm input, #addPhotoForm select');
inputs.forEach((input) => {
	input.addEventListener('input', function () {
		const allFilled = Array.from(inputs).every((input) => input.value !== '');
		document.querySelector('#addPhotoForm input[type="submit"]').disabled = !allFilled;
	});
});
