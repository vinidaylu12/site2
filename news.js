document.addEventListener("DOMContentLoaded", () => {
    const imageForm = document.getElementById("imageForm");
    const imageGallery = document.getElementById("imageGallery");

    function loadImages() {
        fetch("/images")
            .then(response => response.json())
            .then(images => {
                imageGallery.innerHTML = "";
                images.forEach((image, index) => {
                    const imageContainer = document.createElement("div");
                    imageContainer.classList.add("image-container");

                    imageContainer.innerHTML = `
                        <img src="${image.url}" alt="${image.title}">
                        <h3>${image.title}</h3>
                        <p>${image.caption}</p>
                        <button class="delete-button" data-index="${index}">Excluir</button>
                    `;

                    imageGallery.appendChild(imageContainer);

                    imageContainer.querySelector(".delete-button").addEventListener("click", () => {
                        deleteImage(index);
                    });
                });
            })
            .catch(error => console.error("Erro ao carregar imagens:", error));
    }

    function deleteImage(index) {
        fetch(`/delete-image/${index}`, { method: "DELETE" })
            .then(response => response.text())
            .then(() => loadImages())
            .catch(error => console.error("Erro ao excluir imagem:", error));
    }

    imageForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const url = document.getElementById("imageUrl").value;
        const title = document.getElementById("imageTitle").value;
        const caption = document.getElementById("imageCaption").value;

        fetch("/save-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, title, caption })
        })
        .then(response => response.text())
        .then(() => {
            imageForm.reset();
            loadImages();
        })
        .catch(error => console.error("Erro ao salvar imagem:", error));
    });

    loadImages();
});

