/*
Copyright (C) 2018
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

"use strict";

const common = require('./../common.js');

var usersCollection;

/**
 * instantiate the users database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    usersCollection = collectionObject;
}

/**
 * add a user object to the users collection
 *
 * @param {object} user user object to add
 * @param {function} callback callback function
 */
const addUser = function (user, callback) {
    usersCollection.update(
        { username: user.username },
        { $setOnInsert: user },
        { upsert: true },
        function (err, res) {
            if (err) {
                return callback(common.getError(1004), null);
            }

            if (!res.result.upserted) {
                return callback(common.getError(2001), null);
            }

            return callback(null, user);
        }
    );
}

/**
 * find a single user by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getUser = function (searchQuery, callback) {
    usersCollection.findOne(searchQuery, function (err, obj) {
        if (err) {
            return callback(common.getError(1003), null);
        }

        if (!obj) {
            return callback(common.getError(2003), null);
        }

        return callback(null, obj);
    });
}

/**
 * get the limited list of users from the database
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedUsersListSorted = function (searchQuery, sortQuery, lim, callback) {
    usersCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            return callback(common.getError(1008), null);
        }

        return callback(null, list);
    });
}

/**
 * find a single user by the search parameters,
 * then update its values by the update parameters
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateUser = function (searchQuery, updateQuery, callback) {
    usersCollection.update(searchQuery, updateQuery, function (err, result) {
        if (err) {
            return callback(common.getError(1007), null);
        }

        return callback(null, 'ok');
    });
}

// <exports> -----------------------------------
exports.addUser = addUser;
exports.getLimitedUsersListSorted = getLimitedUsersListSorted;
exports.getUser = getUser;
exports.initialize = initialize;
exports.updateUser = updateUser;
// </exports> ----------------------------------