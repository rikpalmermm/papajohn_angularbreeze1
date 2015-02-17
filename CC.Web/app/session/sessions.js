(function () {
    'use strict';
    var controllerId = 'sessions';
    angular.module('app').controller(controllerId, ['datacontext', 'common', sessions]);

    function sessions(datacontext, common) {
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);

        var vm = this;
        vm.title = 'Sessions Title';
        vm.subtitle = 'Sessions SubTitle';
        vm.sessions = [];

        vm.activate = activate;
        activate();

        function activate() {
            common.activateController([getSessions()], controllerId)
                .then(function () { log('Activated Session View'); });
        }

        function getSessions() {
            return datacontext.getSessionPartials().then(function (data) {
                console.log('DATA: ',data);
                return vm.sessions = data;
            });
        }


    }
})();