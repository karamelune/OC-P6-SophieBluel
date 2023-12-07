// Récupération du formulaire et du champ de mot de passe
const loginForm = document.querySelector('#login form');
const passwordField = document.querySelector('#password');

// Écoute de l'événement 'submit' sur le formulaire
loginForm.addEventListener('submit', async function (event) {
	// Empêche la soumission normale du formulaire
	event.preventDefault();

	// Récupération des valeurs des champs du formulaire
	const email = document.querySelector('#email').value;
	const password = passwordField.value;

	// Tentative de connexion
	const response = await fetch('http://localhost:5678/api/users/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ email, password }),
	});

	if (response.ok) {
		// Si la tentative réussit, stocke le token et redirige vers la page d'accueil
		const data = await response.json();
		localStorage.setItem('token', data.token);
		window.location.href = '/index.html';
	} else {
		// Si la tentative échoue, affiche un message d'erreur
		let loginError = loginForm.querySelector('.error');

		// Affiche un message d'erreur différent en fonction du code d'erreur
		switch (response.status) {
			case 401:
				loginError.textContent = 'Mot de passe incorrect.';
				break;
			case 404:
				loginError.textContent = 'Utilisateur introuvable.';
				break;
			default:
				loginError.textContent = 'Erreur dans l’identifiant ou le mot de passe.';
				break;
		}
	}
});
