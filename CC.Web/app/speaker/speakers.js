(function () {
    'use strict';

    var controllerId = 'speakers';

    angular.module('app').controller(controllerId,
        ['common', 'config', 'datacontext', speakers]);

    function speakers(common, config, datacontext) {
        var vm = this;
        var keyCodes = config.keyCodes;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(controllerId);

        vm.refresh = refresh;
        vm.title = 'Speakers';
        vm.search = search;
        vm.speakers = [];
        vm.speakerSearch = '';
        vm.filteredSpeakers = [];

        activate();

        function activate() {
            common.activateController([getSpeakers()], controllerId)
                .then(function () { log('Activated Speakers View'); });
        }

        function refresh() { getSpeakers(true); }

        function getSpeakers(forceRefresh) {
            return datacontext.getSpeakerPartials(forceRefresh).then(function (data) {
                vm.speakers = data;
                applyFilter();
                return vm.speakers;
            });
        }

        function search($event) {
            if ($event.keyCode == keyCodes.esc) {
                vm.speakerSearch = '';
            }
            applyFilter();
        }

        function speakerFilter(speaker) {
            var isMatch = vm.speakerSearch ? common.textContains(speaker.fullName, vm.speakerSearch) : true;
            return isMatch;
        }

        function applyFilter() {
            vm.filteredSpeakers = vm.speakers.filter(speakerFilter);
        }
    }
})();
