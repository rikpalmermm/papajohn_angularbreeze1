(function () {
    'use strict';

    var controllerId = 'sessions';

    angular.module('app').controller(controllerId,
        ['$routeParams', 'common', 'config', 'datacontext', sessions]);

    function sessions($routeParams, common, config, datacontext) {
        var vm = this;
        var keyCodes = config.keyCodes;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);

        vm.sessions = [];
        vm.refresh = refresh;
        vm.search = search;
        vm.title = 'Sessions';
        vm.sessionsSearch = $routeParams.search || '';
        vm.filteredSessions = [];
        vm.sessionsFilter = sessionsFilter;

        activate();

        function activate() {
            common.activateController(getSessions(), controllerId)
                .then(function () {
                    // vm.sessionsSearch (user entereed search), vm.sessions (orig unfiltered), 
                    // vm.filteredSessions (filtered array), vm.sessionsFilter (filtering fn)
                    applyFilter = common.createSearchThrottle(vm, 'sessions');
                    if (vm.sessionsSearch) { applyFilter(true); }
                    log('Activated Sessions View');
                });
        }

        function refresh() { getSessions(true); }

        function getSessions(forceRefresh) {
            return datacontext.getSessionPartials(forceRefresh)
                .then(function (data) {
                return vm.sessions = vm.filteredSessions = data;
            });
        }

        function search($event) {
            if ($event.keyCode == keyCodes.esc) {
                vm.sessionsSearch = '';
                applyFilter(true);
            } else {
                applyFilter();
            }
        }

        function sessionsFilter(session) {
            var textContains = common.textContains;
            var searchText = vm.sessionsSearch;
            var isMatch = searchText
                ?    textContains(session.title, searchText)
                  || textContains(session.tagsFormatted, searchText)
                  || textContains(session.room.name, searchText)
                  || textContains(session.track.name, searchText)
                  || textContains(session.speaker.fullName, searchText)
                : true;
            return isMatch;
        }

        function applyFilter() {
            vm.filteredSpeakers = vm.speakers.filter(speakerFilter);
        }
    }
})();
