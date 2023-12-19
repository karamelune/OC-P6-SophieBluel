// Initialisation des éléments du DOM nécessaires pour le script
const portfolio = document.getElementById('portfolio');
const gallery = portfolio.querySelector('.gallery');
const [loginBtn, adminBanner, editBtn, filters] = [
	'loginBtn',
	'adminBanner',
	'editBtn',
	'filters',
].map((id) => document.getElementById(id));

// Elements nécessaires pour la modale d'édition
const addPhotoForm = document.getElementById('addPhotoForm');
const photoFormError = document.querySelector('#addPhotoForm .error');
const photoFormSubmit = document.querySelector('#addPhotoForm input[type="submit"]');

// Variables globales et fragments
let projects = [];
let categoryMap = {};
categoryMap[0] = 'Tous';
let activeFilter;
const fragmentProjects = new DocumentFragment();
const fragmentFilters = new DocumentFragment();

async function fetchProjects() {
	try {
		const response = await fetch('http://localhost:5678/api/works');
		if (!response.ok) {
			throw new Error(`Erreur HTTP: ${response.status}`);
		}
		const data = await response.json();
		data.forEach((project) => {
			const { categoryId, id, imageUrl, title } = project;
			projects.push({ categoryId, id, imageUrl, title });
		});
	} catch (error) {
		console.error('Erreur lors de la récupération des projets:', error);
	}
}

async function fetchCategories() {
	try {
		const response = await fetch('http://localhost:5678/api/categories');
		if (!response.ok) {
			throw new Error(`Erreur HTTP: ${response.status}`);
		}
		const data = await response.json();
		data.forEach((category) => {
			categoryMap[category.id] = category.name;
		});
	} catch (error) {
		console.error('Erreur lors de la récupération des catégories:', error);
	}
}

function createFigureElement(categoryId, addCategoryId) {
	const figure = document.createElement('figure');
	addCategoryId && (figure.dataset.categoryId = categoryId);
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
	const { categoryId, id, imageUrl, title } = project;

	if (!document.getElementById(id)) {
		const figure = createFigureElement(categoryId, true);
		figure.appendChild(createImageElement(imageUrl, title));
		figure.appendChild(createFigcaptionElement(title));
		element.appendChild(figure);
	}
}

function createFilters() {
	Object.entries(categoryMap).forEach(([categoryId, categoryName]) => {
		const btn = document.createElement('button');
		btn.classList.add('filter');
		btn.textContent = categoryName;
		if (categoryName === 'Tous') {
			btn.classList.add('filter-active');
			activeFilter = btn;
		}
		btn.addEventListener('click', () => {
			activeFilter.classList.remove('filter-active');
			activeFilter = btn;
			activeFilter.classList.add('filter-active');
			filterGallery(categoryId);
		});
		fragmentFilters.appendChild(btn);
	});

	filters.appendChild(fragmentFilters);
}

function filterGallery(categoryId) {
	const figures = gallery.querySelectorAll('figure');
	if (categoryId === '0' || categoryId === undefined) {
		figures.forEach((figure) => {
			figure.classList.remove('hidden');
		});
	} else {
		figures.forEach((figure) => {
			if (figure.dataset.categoryId === categoryId) {
				figure.classList.remove('hidden');
			} else {
				figure.classList.add('hidden');
			}
		});
	}
}

async function main() {
	await fetchProjects();
	await fetchCategories();
	projects.forEach((project) => {
		addProjectToDOM(project, fragmentProjects);
	});
	gallery.appendChild(fragmentProjects);
	createFilters();
}

main();
/********* ADMIN *********/

// Récupération du token stocké
const token = localStorage.getItem('token');
if (token) {
	loginBtn.textContent = 'logout';
	loginBtn.href = '#';
	loginBtn.onclick = () => {
		// Enlever le token du localstorage et rafraîchir la page
		localStorage.removeItem('token');
		location.reload();
	};

	// Cacher les filtres de la galerie et afficher le mode administrateur
	filters.style.display = 'none';
	displayAdminMode();
}

// Afficher le mode admin
function displayAdminMode() {
	adminBanner.classList.replace('hidden', 'flex');
	editBtn.classList.remove('hidden');
	editBtn.addEventListener('click', displayEditModale);
}

// Fonction permettant de créer une icône de corbeille pour supprimer un projet
function createTrashCan(projectId) {
	const trashCan = document.createElement('div');
	trashCan.classList = 'trashCan';
	const trashCanIcon = document.createElement('i');
	trashCanIcon.classList.add('fa-solid', 'fa-trash-can');
	trashCan.addEventListener('click', () => deleteProject(projectId).catch(console.error));
	trashCan.appendChild(trashCanIcon);
	return trashCan;
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
				const figure = createFigureElement(false);
				const img = createImageElement(project.imageUrl, project.title);
				const trashCan = createTrashCan(project.id, deleteProject);

				figure.appendChild(img);
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
		Object.entries(categoryMap).forEach(([categoryId, categoryName]) => {
			// On vérifie si l'option n'existe pas déjà et si l'ID de la catégorie n'est pas 0
			if (
				!Array.from(categorySelect.options).find((option) => option.value === categoryId) &&
				categoryName !== 'Tous'
			) {
				// On crée une nouvelle option
				const option = document.createElement('option');

				// On définit la valeur et le texte de l'option
				option.value = categoryId;
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

		// Supprimer le projet du tableau 'projects' et de la galerie
		const projectUrl = projects.find((project) => project.id === projectId).imageUrl;
		projects = projects.filter((project) => project.id !== projectId);
		projectsToDelete = document.querySelectorAll(`figure img[src="${projectUrl}"]`);
		projectsToDelete.forEach((project) => project.parentNode.remove());
	} catch (error) {
		console.error('Erreur lors de la suppression du projet:', error);
	}
}

// Ajouter un projet
addPhotoForm.addEventListener('submit', function (event) {
	event.preventDefault();

	let formData = new FormData();
	formData.append('image', document.getElementById('image').files[0]);
	formData.append('title', document.getElementById('title').value);

	let selectedCategoryId = document.getElementById('category').value;
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
			const project = {
				categoryId: data.categoryId,
				id: data.id,
				imageUrl: data.imageUrl,
				title: data.title,
			};
			projects.push(project);
			addProjectToDOM(data, gallery);
			filterGallery();
			resetForm();
			displayEditModale();
		})
		.catch((error) => {
			console.error('Erreur:', error);
			alert(error.message);
		});
});

// Vérification et affichage de l'image
function handleFileInput(event) {
	photoFormError.textContent = '';

	const file = event.target.files[0];
	const fileName = file.name;
	const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
	const maxSize = 4 * 1024 * 1024; // 4Mo en bytes

	if (!allowedExtensions.test(fileName)) {
		handleError('Seuls les fichiers JPG, JPEG et PNG sont autorisés.');
		return;
	}

	if (file.size > maxSize) {
		handleError('La taille du fichier ne doit pas dépasser 4Mo.');
		return;
	}

	const reader = new FileReader();
	reader.onload = function (event) {
		imagePreview.src = event.target.result;
		deleteImagePreview.classList.remove('hidden');
	};
	reader.readAsDataURL(file);
}

// Gestion des erreurs
function handleError(errorMessage) {
	photoFormError.textContent = errorMessage;
	image.value = null;
}

// Afficher l'image sélectionnée lors d'un changement de fichier
image.addEventListener('change', handleFileInput);

// Drag and drop
formImageInput.ondragover = formImageInput.ondragenter = function (event) {
	event.preventDefault();
};

// Afficher l'image sélectionnée lors d'un drag and drop
formImageInput.ondrop = function (event) {
	event.preventDefault();
	const file = event.dataTransfer.files[0];
	handleFileInput({ target: { files: [file] } });
	const dataTransfer = new DataTransfer();
	dataTransfer.items.add(file);
	image.files = dataTransfer.files;
	image.dispatchEvent(new Event('input'));
};

// Supprimer l'image sélectionnée
deleteImagePreview.addEventListener('click', function () {
	imagePreview.src = '';
	image.value = null;
	deleteImagePreview.classList.add('hidden');
	image.dispatchEvent(new Event('input'));
});

// Vérifier que tous les champs sont remplis avant d'activer le bouton d'envoi
const inputs = document.querySelectorAll('#addPhotoForm input, #addPhotoForm select');
inputs.forEach((input) => {
	input.addEventListener('input', function () {
		const allFilled = Array.from(inputs).every((input) => {
			return input.value !== '';
		});
		photoFormSubmit.disabled = !allFilled;
	});
});

// Réinitialiser le formulaire
function resetForm() {
	addPhotoForm.reset();
	imagePreview.src = '';
	deleteImagePreview.classList.add('hidden');
	photoFormSubmit.disabled = true;
}
