var mysql = require('../public/javascripts/mysqlConn').pool;

module.exports.getNeroPatients = function(neroId, callback, next){
    mysql.getConnection(function(err, conn){
        if(err){
            callback(err, {code:500, status: "Error in the connection to the database"})
            return;
        }
        conn.query("select patientId, name, email, TIMESTAMPDIFF(YEAR, birthdate, CURRENT_DATE()) as age, user_locId from User, Patient, Attribution where userId = patient_userId and patient_userId = attrib_fileId and attrib_neroId = ?", 
        [neroId], function(err, result){
            conn.release();
            if(err){
                callback(err, {code:500, status: "Error in a database query"})
                return;
            }
            callback(false, {code:200, status:"Ok", patients: result});
        })
    })
};

module.exports.getPatientInfo = function(patientId, callback, next){
    mysql.getConnection(function(err, conn){
        if(err){
            callback(err, {code:500, status:"Error in the connection to the database"})
            return;
        }
        conn.query("select patientId, name, sex, TIMESTAMPDIFF(YEAR, birthdate, CURRENT_DATE()) as age from User, Patient where patientId = ? and patient_userId = userId;",
        [patientId], function(err, result){
            conn.release();
            if(err){
                callback(err, {code:500, status:"Error in a database query"})
                return;
            }
            callback(false, {code:200, status:"Ok", patient: result[0]})
        })
    })
}

module.exports.postTest = function(patientId, neroId, callback, next){
    mysql.getConnection(function(err, conn){
        if(err){
            callback(err, {code:500, status:"Error in the connection to the database"})
            return;
        }
        conn.query("select attribId from Attribution where attrib_fileId = ? and attrib_neroId = ?;", [patientId, neroId], function(err, result){
            if(err){
                callback(err, {code:500, status: "Error in a database query"})
                return;
            }
            var attribId = result[0].attribId;

            conn.query("insert into Test (assignedDate, test_attribId) values (?, ?);", [new Date(), attribId], function(err, result){
                conn.release();
                if(err){
                    callback(err, {code:500, status: "Error in a database query"});
                    return;
                }
                callback(false, {code:200, status:"Ok"});
            });
        })
    })
}

module.exports.getReplay = function(patientId, testId, callback, next){
    mysql.getConnection(function(err, conn){
        if(err){
            callback(err, {code:500, status: "Error in the connection to the database"})
            return;
        }
        conn.query("select rec from Result where result_testId = ?", [testId], function(err, result){
            conn.release();
            if(err){
                callback(err, {code:500, status:"Error in a databse query"});
                return;
            }
            
            var rec = result[0].rec;
            callback(false, {code:200, status:"Ok", rec: rec});
        })
    })
}

module.exports.getPatientTests = function(neroId, patientId, callback, next){
    mysql.getConnection(function(err, conn){
        if(err){
            callback(err, {code:500, status:"Error in the connection to the database"})
            return;
        }
        conn.query("select distinct testId, testState, assignedDate, completedDate, comment from Test left outer join Result on testId = result_testId, File, Neropsi where test_attribId in(select attribId from Attribution where attrib_fileId = ? and attrib_neroId = ?);",
        [patientId, neroId], function(err, result){
            conn.release();
            if(err){
                callback(err, {code:500, status:"Error in a database query"});
                return;
            }
            for(t of result){
                var formattedDate = t.assignedDate.getDate() + "-" + (t.assignedDate.getMonth() + 1) + "-" + t.assignedDate.getFullYear();
                t.assignedDate = formattedDate;
                if(t.completedDate){
                    formattedDate = t.completedDate.getDate() + "-" + (t.completedDate.getMonth() + 1) + "-" + t.completedDate.getFullYear();
                    t.completedDate = formattedDate;
                }else{
                    t.completedDate = "-";
                }
                if(!t.comment){
                    t.comment = "-";
                }
            }
            callback(false, {code:200, status:"Ok", tests: result});
        })
    })
}

module.exports.getPatientRoutes = function(neroId, patientId, callback, next){
    mysql.getConnection(function(err, conn){
        if(err){
            callback(err, {code:500, status: "Error in the connection to the database"})
            return;
        }
        conn.query("select waypoints, time, distance from Route where route_testId in (select testId from Test where test_attribId in (Select attribId from Attribution where attrib_fileId = ? and attrib_neroId = ?));", [patientId, neroId], function(err, result){
            conn.release();
            if(err){
                callback(err, {code:500, status:"Error in a databse query"});
                return;
            }
            var routes = result;
            callback(false, {code:200, status:"Ok", routes: routes});
        })
    })
}

module.exports.getNeuroTestsRoutes = function(neroId, callback, next){
    console.log(neroId)
    mysql.getConnection(function(err, conn){
        if(err){
            callback(err, {code:500, status: "Error in the connection to the database"})
            return;
        }
        conn.query("select MAX(attrib_fileId) as patientId, MAX(name) as name, count(routeId) as repetitions, coords, waypoints, time, distance from Location inner join Route on route_locId = locId inner join Test on test_routeId = routeId inner join Attribution on test_attribId = attribId inner join Patient on attrib_fileId = patientId inner join User on patient_userId = userId where attrib_neroId = ? group by routeId order by patientId;", 
        [neroId], function(err, result){
            conn.release();
            if(err){
                callback(err, {code:500, status:"Error in a databse query"});
                return;
            }
            var routes = [];

            for(i=0; i<result.length; i++){
                if(!result[i+1] || result[i+1].patientId != result[i].patientId){
                  var splice = result.splice(0,i+1);
                  var patientRoutes = [];
                  var patientId = splice[0].patientId;
                  var name = splice[0].name;
                  for(r of splice){
                      patientRoutes.push({repetitions: r.repetitions, coords: r.coords, waypoints: r.waypoints, time: r.time, distance: r.distance})
                  }
                  routes.push({patientId: patientId, name: name, routes: patientRoutes});
                  i=-1;
                }
              }
            callback(false, {code:200, status:"Ok", routes: routes});
        })
    })
}