document.addEventListener('DOMContentLoaded', function() {
    const usersUrl = 'https://json.medrating.org/users/';
    const albumsUrl = 'https://json.medrating.org/albums?userId=';
    const albumCoversUrl = 'https://json.medrating.org/photos?albumId=';
    const preloader = createNode('div', 'preloader');
    const imgTitle = createNode('span', 'img-title');
    const favoritesWrapper = document.getElementById('favorites-wrapper');
    const catalogueWrapper = document.getElementById('catalogue-wrapper');
    const errorMessage =
        `<div class="message">
            <img src="./assets/error.png">
            <div class="message__text">
                <span class="message__title">Сервер не отвечает</span>
                Уже работаем над этим!
            </div>
        </div>`
    const emptyMessage =
        `<div class="message">
            <img src="./assets/empty.png">
            <div class="message__text">
                <span class="message__title">Список избранного пуст</span>
                Добавляйте изображения, нажимая на звездочки            
            </div>
        </div>`

    let favorites = JSON.parse(window.localStorage.getItem('favorites')) || [];

    fetchAndRender(usersUrl, catalogueWrapper, 1);
    renderFavorites(favoritesWrapper);

    document.querySelector('.wrapper').addEventListener('click', detectClickTarget);
    document.querySelector('.wrapper').addEventListener('mouseover', detectHoverImg);

    function createNode(element, className = false) {
        let node = document.createElement(element);
        if (className) {
            node.className = className;
        }
        return node;
    }

    function appendNode(parent, el) {
        return parent.appendChild(el);
    }

    function detectHoverImg(evt) {
        if (evt.target.classList.contains('thumbnail')) {
            appendTitle(evt);
            evt.target.addEventListener("mousemove", redrawTitle)
            evt.target.addEventListener("mouseout", removeTitle)
        }
    }

    function appendTitle(evt) {
        imgTitle.textContent = evt.target.dataset.title;
        appendNode(document.body, imgTitle);
    }

    function redrawTitle(evt) {
        imgTitle.style.top = evt.pageY + 'px';
        imgTitle.style.left = evt.pageX + 'px';
    }

    function removeTitle(evt) {
        evt.target.removeEventListener("mousemove", redrawTitle)
        evt.target.removeEventListener("mouseout", removeTitle)
        document.querySelector('.img-title').remove();
    }

    function detectClickTarget(evt) {
        if (evt.target.parentElement.id === "tabs") {
            toggleTabs(evt);
        } else if (evt.target.classList.contains('catalogue-item__header')) {
            toggleAccordion(evt);
        } else if (evt.target.classList.contains('album-covers__favorite-toggle')) {
            toggleFavorites(evt);
        } else if (evt.target.classList.contains('thumbnail')) {
            showModal(evt);
        }
    }

    function showModal(evt) {
        let modal = createNode('div');
        modal.id = 'modal';
        modal.innerHTML =
            `<span id="modal-close"></span>
             <img id="modal-image" src="${evt.target.dataset.url}">
            `;
        appendNode(document.body, modal);
        document.getElementById('modal-close').addEventListener('click', removeModal);
    }

    function removeModal() {
        document.getElementById('modal').remove()
    }

    function toggleTabs(evt) {
        if (evt.target.id == 'catalogue') {
            evt.target.nextElementSibling.classList.remove('active');
            favoritesWrapper.style.display = 'none';
            catalogueWrapper.style.display = 'block';

        } else if (evt.target.id === 'favorites') {
            evt.target.previousElementSibling.classList.remove('active');
            favoritesWrapper.style.display = 'block';
            catalogueWrapper.style.display = 'none';
        }
        evt.target.classList.add('active');
    }

    function toggleFavorites(evt) {
        let index = favorites.findIndex(n => n.id === evt.target.dataset.albumId);
        if (index > -1) {
            favorites.splice(index, 1);
            favoritesWrapper.querySelector(`[data-album-id~='${evt.target.dataset.albumId}']`).parentElement.remove();
            let buttonInCatalogue = catalogueWrapper.querySelector(`[data-album-id~='${evt.target.dataset.albumId}']`);
            if (buttonInCatalogue) {
                buttonInCatalogue.classList.toggle('favorite');
            }
            if (!favorites.length) {
                favoritesWrapper.firstElementChild.innerHTML = emptyMessage;
            }
        } else {
            const favObj = {
                id: evt.target.dataset.albumId,
                thumbnailUrl: evt.target.nextElementSibling.src,
                url: evt.target.nextElementSibling.dataset.url,
                title: evt.target.nextElementSibling.dataset.title,
            };
            favorites.push(favObj);

            if (favorites.length === 1) {
                favoritesWrapper.firstElementChild.innerHTML = '';
            }

            favoritesWrapper.firstElementChild.innerHTML += createAlbumCoverItem(favObj, true);
            evt.target.classList.toggle('favorite');
        }
        window.localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    function createAlbumCoverItem(item, favoritesSection = false) {
        const isFavorite = favorites.some(elem => elem.id === item.id + '')
        const albumCoversItem =
            `<div class="album-covers__item">
                <button class="album-covers__favorite-toggle ${isFavorite ? 'favorite' : ''}" data-album-id="${item.id}"></button>
                <img class="thumbnail "src="${item.thumbnailUrl}" data-url="${item.url}" data-title="${item.title}">
                ${favoritesSection ? '<div class="album-covers__title">' + item.title + '</div>' :''}
            </div>`;
        return albumCoversItem;
    }

    function createCatalogueItem(item, accordionLevel) {
        const catItem =
            `<div class="catalogue-item ${(accordionLevel === 2) ? 'child' : ''}">
                <div class="catalogue-item__header expand" data-id ="${item.id}">
                ${item.name || item.title}
                </div>
                <div class="catalogue-item__content"></div>
            </div>`;
        return catItem;
    }

    function renderFavorites(parent) {
        let albumCovers = createNode('div', 'album-covers');

        if (!favorites.length) {
            albumCovers.innerHTML = emptyMessage;
        };

        favorites.forEach((item) => {
            albumCovers.innerHTML += createAlbumCoverItem(item, true);
        });
        appendNode(parent, albumCovers);
    }

    function fetchAndRender(url, target, accordionLevel) {
        target.innerHTML = '';
        let albumCovers = createNode('div', 'album-covers');
        appendNode(target.parentElement, preloader);

        fetch(url)
            .then((resp) => resp.json())
            .then((data) => {
                data.forEach((item) => {
                    if (accordionLevel === 3) {
                        albumCovers.innerHTML += createAlbumCoverItem(item);
                    } else if (item.name || item.title) {
                        target.innerHTML += createCatalogueItem(item, accordionLevel);
                    }
                });

                if (accordionLevel === 2) {
                    target.style.height = target.scrollHeight + 'px';
                } else if (accordionLevel === 3) {
                    appendNode(target, albumCovers);
                    target.style.height = target.scrollHeight + 'px';
                    parent = target.parentElement.closest('.catalogue-item__content');
                    parent.style.height = target.scrollHeight + parent.offsetHeight + 'px';
                }

                target.parentElement.querySelector('.preloader').remove();
            })
            .catch((error) => {
                console.log(error);
                target.parentElement.querySelector('.preloader').remove();
                target.innerHTML = errorMessage;
            });
    }

    function toggleAccordion(evt) {
        const itemHeader = evt.target;
        const id = itemHeader.dataset.id;
        const itemContent = itemHeader.nextElementSibling;
        const itemIsChild = itemHeader.parentElement.classList.contains('child');
        const parentContent = itemHeader.closest('.catalogue-item__content');
        const expand = itemHeader.classList.contains('expand');
        const collapse = itemHeader.classList.contains('collapse');

        if (expand && itemIsChild) {
            fetchAndRender(albumCoversUrl + id, itemContent, 3);
        } else if (collapse && itemIsChild) {
            itemContent.style.height = '';
            parentContent.style.height = parentContent.offsetHeight - itemContent.offsetHeight + 'px';
        } else if (expand) {
            fetchAndRender(albumsUrl + id, itemContent, 2);
        } else {
            itemContent.style.height = '';
        }

        itemHeader.classList.toggle('collapse');
        itemHeader.classList.toggle('expand');
    }
});