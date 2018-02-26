/*
Copyright (C) 2016
Developed at University of Toronto

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const navProjectsId = '#nav-projects';
const navmProjectsId = '#navm-projects';
const descriptionId = '#description';
const titleId = '#title';
const projectAddform = '#projectAddform';

$(function () {
    $(navProjectsId).addClass('active');
    $(navmProjectsId).addClass('active');

    $('select').material_select();

    $(projectAddform).submit(function (evt) {
        evt.preventDefault();

        if ($(descriptionId).summernote('isEmpty')) {
            return warningSnackbar(translate('emptyProjectDescription'));
        }

        const titleText = $(titleId).val();
        const descriptionText = $(descriptionId).summernote('code');

        $.ajax({
            type: 'PUT',
            url: '/projects/create',
            data: {
                title: titleText,
                description: descriptionText
            },
            success: function (data) {
                window.location.href = `/project/${data}`;
            },
            error: function (data) {
                handle401And404(data);

                const jsonResponse = data.responseJSON;
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        });
    });
});