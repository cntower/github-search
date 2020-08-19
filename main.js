'use strict';
var state = (function () {
    var storageKey = 'GITHUB_SEARCH_STATE'
    var searchValue = '';
    var page = 1;
    var perPage = 5;
    var reposIds = [];
    var repos = {};
    var loading = false;
    var saveToStorage = function () {
        var githubSearchState = JSON.stringify({
            searchValue: this.searchValue,
            page: this.page,
            perPage: this.perPage,
            reposIds: this.reposIds,
            repos: this.repos,
        });
        window.localStorage.setItem(storageKey, githubSearchState);
    };
    var loadFromStorage = function () {
        var githubSearchStateStr = window.localStorage.getItem(storageKey);
        if (githubSearchStateStr) {
            var githubSearchState = JSON.parse(githubSearchStateStr);
            this.searchValue = githubSearchState.searchValue;
            this.page = githubSearchState.page;
            this.perPage = githubSearchState.perPage;
            this.reposIds = githubSearchState.reposIds;
            this.repos = githubSearchState.repos;
        }
        redrowItems();
        document.getElementById('searchInput').value = this.searchValue;
    };
    var deleteRepos = function () {
        this.reposIds = [];
        this.repos = {};
    }
    return {
        searchValue: searchValue,
        page: page,
        perPage: perPage,
        reposIds: reposIds,
        repos: repos,
        loading: loading,
        saveToStorage: saveToStorage,
        loadFromStorage: loadFromStorage,
        deleteRepos: deleteRepos,
    };
})();

var addRepo = function (repo) {
    state.repos[repo.id] = repo;
    state.reposIds.push(repo.id);
}
var updateRepos = function (newRepos) {
    // delete items
    state.deleteRepos();
    // add new items
    newRepos.forEach(function (repo) {
        if (repo && repo.id) {
            addRepo(repo);
        }
    });
    redrowItems();
    state.saveToStorage();
}
var addRepos = function (newRepos) {
    newRepos.forEach(function (repo) {
        if (repo && repo.id) {
            drowItem(repo);
            addRepo(repo);
        }
    });
    state.saveToStorage();
}
var githubRepositories = (function () {
    var xhttp;
    var url;
    return {
        search: function (str, page, perPage, cb, cbErr, cbEnd) {
            url = 'https://api.github.com/search/repositories?q=' +
                str +
                '&sort=stars&order=desc' +
                '&page=' + page +
                '&per_page=' + perPage;
            xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        cb(this.response);
                    } else {
                        cbErr && cbErr(this.response);
                    }
                    cbEnd(this.response);
                }
            };
            xhttp.responseType = 'json';
            xhttp.open(
                'GET',
                url,
                true
            );
            xhttp.send();
        }
    }
})();

var stargazersFormat = function (stargazersCount) {
    var res = stargazersCount;
    if (+stargazersCount > 1000) {
        res = '' + Math.floor(stargazersCount / 1000) + 'K';
    }
    return res;
}

var drowItem = function (repo) {
    var ul = document.getElementById('resultList');
    var li = document.createElement('li');
    var avatar = document.createElement('img');
    avatar.setAttribute('class', 'item-result__avatar');
    avatar.setAttribute('src', repo.owner.avatar_url);
    avatar.setAttribute('alt', repo.owner.login);
    li.appendChild(avatar);
    var description = document.createElement('span');
    description.setAttribute('class', 'item-result__description');
    description.appendChild(document.createTextNode(repo.description));

    var fullName = document.createElement('span');
    fullName.setAttribute('class', 'item-result__full-name');
    fullName.appendChild(document.createTextNode(repo.full_name));

    var divCenter = document.createElement('div');
    divCenter.setAttribute('class', 'item-result__center');

    var starImg = document.createElement('img');
    starImg.setAttribute('src', 'star.png');
    starImg.setAttribute('class', 'item-result__star-img');

    var stars = document.createElement('div');
    stars.setAttribute('class', 'item-result__stars');
    stars.appendChild(starImg);
    stars.appendChild(document.createTextNode(stargazersFormat(repo.stargazers_count)));
    divCenter.appendChild(fullName);
    divCenter.appendChild(description);
    li.appendChild(divCenter);
    li.appendChild(stars);
    li.setAttribute('id', repo.id);
    li.setAttribute('class', 'item-result');
    ul.appendChild(li);
};

var redrowItems = function () {
    var ul = document.getElementById('resultList');
    ul.innerHTML = '';
    state.reposIds.forEach(function (id) {
        drowItem(state.repos[id]);
    })
}

var onKeyup = function () {
    var value = this.value.replace(/^\s+|\s+$/g, '');
    if (state.searchValue === value) {
        return;
    }
    state.searchValue = value;
    if (value === '') {
        state.deleteRepos();
        redrowItems();
        state.saveToStorage();
        return;
    }
    state.page = 1;
    state.loading = true;
    githubRepositories.search(value, state.page, state.perPage,
        function (response) {
            var isActual = state.searchValue === value;
            if (isActual) {
                updateRepos(response.items);
            }
        },
        function (response) { console.log('error:', response) },
        function () { state.loading = false; }
    );
};

var isBottomVisible = function (el) {
    var rect = el.getBoundingClientRect();
    var isBottomVisible = (rect.bottom <= window.innerHeight);
    return isBottomVisible;
}

var onScroll = function (e) {
    var ul = document.getElementById('resultList');
    if (isBottomVisible(ul) && state.loading === false) {
        state.page++;
        state.loading = true;
        githubRepositories.search(state.searchValue, state.page, state.perPage,
            function (response) {
                addRepos(response.items);
            },
            function (response) { console.log('error:', response) },
            function () { state.loading = false; }
        );
    }
};

(function () {
    document.getElementById('searchInput').addEventListener('keyup', onKeyup);
    window.addEventListener('scroll', onScroll);
    state.loadFromStorage();
})();

