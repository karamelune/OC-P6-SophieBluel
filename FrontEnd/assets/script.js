const gallery = document.querySelector('.gallery');

// Récupération des projets depuis l'API
fetch('http://localhost:5678/api/works')
.then(response => response.json())
.then(data => {
    data.forEach(item => {
        // Création de la balise figure pour chaque item
        const figure = document.createElement('figure');

        // Ajout de l'image
        const img = document.createElement('img');
        img.src = item.imageUrl;
        img.alt = item.title;

        // Ajout du titre
        const figcaption = document.createElement('figcaption');
        figcaption.textContent = item.title;

        // Ajout de l'image et du titre dans la figure
        figure.appendChild(img);
        figure.appendChild(figcaption);

        // Ajout de la figure dans la galerie
        gallery.appendChild(figure);
    });
})
.catch(error => console.error('Erreur:', error));