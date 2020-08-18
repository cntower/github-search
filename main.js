'use strict';
var state = (function () {
    var storageKey = 'GITHUB_SEARCH_STATE'
    var searchValue = '';
    var page = 1;
    var perPage = 5;
    var reposIds = [];
    var repos = {};
    var loading = false;
    var save = function () {
        var githubSearchState = JSON.stringify({
            searchValue: this.searchValue,
            page: this.page,
            perPage: this.perPage,
            reposIds: this.reposIds,
            repos: this.repos,
        });
        window.localStorage.setItem(storageKey, githubSearchState);
    }
    var load = function () {
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
        document.getElementById('searchInput').value = state.searchValue;
    }
    return {
        searchValue: searchValue,
        page: page,
        perPage: perPage,
        reposIds: reposIds,
        repos: repos,
        loading: loading,
        save: save,
        load: load,
    };
})();

var addRepo = function (repo) {
    state.repos[repo.id] = repo;
    state.reposIds.push(repo.id);
}
var updateRepos = function (newRepos) {
    // delete items
    state.reposIds = [];
    state.repos = {};
    // add new items
    newRepos.forEach(function (repo) {
        if (repo && repo.id) {
            addRepo(repo);
        }
    });
    redrowItems();
    state.save();
}
var addRepos = function (newRepos) {
    // add new items
    newRepos.forEach(function (repo) {
        if (repo && repo.id) {
            drowItem(repo);
            addRepo(repo);
        }
    });
    state.save();
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

function stargazersFormat(stargazersCount) {
    var res = stargazersCount;
    if (+stargazersCount > 1000) {
        res = '' + Math.floor(stargazersCount / 1000) + 'K';
    }
    return res;
}

function drowItem(repo) {
    var ul = document.getElementById('resultList');
    var li = document.createElement('li');
    var avatar = document.createElement('img');
    avatar.setAttribute('class', 'item-result__avatar');
    avatar.setAttribute('src', repo.owner.avatar_url);
    avatar.setAttribute('alt', repo.owner.login);
    li.appendChild(avatar);
    // li.appendChild(document.createTextNode(repo.id));
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

function redrowItems() {
    var ul = document.getElementById('resultList');
    ul.innerHTML = '';
    console.log(state.reposIds);
    state.reposIds.forEach(function (id) {
        drowItem(state.repos[id]);
    })
}


var onKeyup = function () {
    if (state.searchValue === this.value) {
        return;
    }
    state.searchValue = this.value;
    state.page = 1;
    state.loading = true;
    githubRepositories.search(this.value, state.page, state.perPage,
        function (response) {
            console.log(response);
            updateRepos(response.items);
        },
        function (response) { console.log('error:', response) },
        function () { state.loading = false; }
    );
};

function isBottomVisible(el) {
    var rect = el.getBoundingClientRect();
    var isBottomVisible = (rect.bottom <= window.innerHeight);
    return isBottomVisible;
}

var onScroll = function (e) {
    console.log(e);
    var ul = document.getElementById('resultList');
    if (isBottomVisible(ul) && state.loading === false) {
        state.page++;
        state.loading = true;
        githubRepositories.search(state.searchValue, state.page, state.perPage,
            function (response) {
                console.log(response);
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
    state.load();
})();

