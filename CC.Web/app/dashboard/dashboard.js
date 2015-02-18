(function () {
    'use strict';
    var controllerId = 'dashboard';
    angular.module('app').controller(controllerId, ['common', 'datacontext', dashboard]);

    function dashboard(common, datacontext) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);

        var vm = this;
        vm.news = {
            title: 'Code Camp',
            description: 'Happy Code Campers.'
        };
        vm.people = [];
        vm.title = 'Dashboard';

        activate();

        function activate() {
            var promises = [getAttendeesCount(), getSpeakersCount(), getSessionsCount(), getPeople()];
            common.activateController(promises, controllerId)
                .then(function () { log('Activated Dashboard View'); });
        }

        function getAttendeesCount() {
            return datacontext.getAttendeesCount().then(function (data) {
                return vm.attendeesCount = data;
            });
        }

        function getSpeakersCount() {
            return datacontext.getSpeakersCount().then(function (data) {
                return vm.speakersCount = data;
            });
        }

        function getSessionsCount() {
            return datacontext.getSessionsCount().then(function (data) {
                return vm.sessionsCount = data;
            });
        }

        function getPeople() {
            return datacontext.getPeople().then(function (data) {
                return vm.people = data;
            });
        }
    }
})();