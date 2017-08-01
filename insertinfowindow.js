function building_content(coordinates, fuel, type, height, ladder) {

  if (type == "Asphalt") {
    image = "https://bcourses.berkeley.edu/courses/1456246/files/70229289/preview";
  } else if (type == "Metal") {
    image = "https://bcourses.berkeley.edu/courses/1456246/files/70229290/preview";
  } else if (type == "Clay Tile") {
    image = "https://bcourses.berkeley.edu/courses/1456246/files/70229292/preview";
  } else if (type == "Wood") {
    image = "https://bcourses.berkeley.edu/courses/1456246/files/70229294/preview";
  } else {
    type = "Unknown";
    image = "https://bcourses.berkeley.edu/courses/1456246/files/70229326/preview";
  }
  customForm = "/forms/d/1DoB3mJpcMMA8NRV9BlHkdxm_EM9kVSsyyz6oh7-GN6U/viewform?c=0&w=1";

  content = '<IMG BORDER="0" ALIGN="Center" SRC=' + image + ' style="width:250px;height:200px;">' +
    '<div id="content">' + '<div id="siteNotice">' + '</div>' +
    '<h2 id="firstHeading" class="firstHeading">' + fuel + '</h2>' +
    '<div id="bodyContent">' + '<p>' +
    'Roof Material: <b>' + type + '</b> </br>' +
    'Siding Material: <b>' + ladder + '</b></br>' +
    'Location: ' + coordinates + '</br></p>' +
    'Last Updated: ' + date + '</p>' +
    '<iframe src="' + customForm + '/viewform?embedded=true" width="500" height="400" >Loading...</iframe></br>';
  return content;
}

function tree_content(coordinates, fuel, type, height, ladder) {

  if (fuel == "c") {
    type = "Coniferous";
    species = "Unknown";
    image = "https://bcourses.berkeley.edu/courses/1456246/files/70229312/preview";

  } else if (fuel == "d") {
    type = "Deciduous";
    species = "Unknown";
    image = "https://bcourses.berkeley.edu/courses/1456246/files/70082860/preview";

  } else if (fuel == "e") {
    type = "Perennial | Evergreen";
    species = "Unknown";
    image = "https://bcourses.berkeley.edu/courses/1456246/files/70229314/preview";

  } else {
    type = "Unknown";
    species = "Unknown";
    image = "https://bcourses.berkeley.edu/courses/1456246/files/70229317/preview";

  }
  if (ladder == "yes" || ladder == "no") {
    if (ladder == "yes") {
      ladder = "Yes";
    } else {
      ladder = "No";
    }
  }
  health = "Unknown";
  cbh = "Unknown";
  customForm = "https://docs.google.com/forms/d/e/1FAIpQLSfUR5Yq6d7x0qEXnnLfofYfWc64OEQxyFyV62ojnqNwp0VEWw";

  content = '<IMG BORDER="0" ALIGN="Center" SRC=' + image + ' style="width:250px;height:200px;">' +
    '<div id="content">' + '<div id="siteNotice">' + '</div>' +
    '<h2 id="firstHeading" class="firstHeading">' + 'Tree' + '</h2>' +
    '<div id="bodyContent">' + '<p>' +
    'Status: <b>' + health + '</b> </br>' +
    'Type: <b>' + type + '</b> </br>' +
    'Species: <b>' + species + '</b></br>' +
    'Canopy Base Height: <b>' + cbh + '</b></br>' +
    'Ladder: <b>' + ladder + '</b></br>' +
    'Location: ' + coordinates + '</br></p>' +
    'Last Updated: ' + date + '</p>' +
    '<iframe src="' + customForm + '/viewform?embedded=true" width="500" height="400" >Loading...</iframe></br>';
  return content;
}

function shrub_content(coordinates, fuel, type, height, ladder) {

  if (fuel == "yes" || fuel == "no") {
    if (fuel == "yes") {
      fuel = "Yes";
    } else {
      fuel = "No";
    }
  }
  if (fuel == 1 || fuel == "Shrub") {
    fuel = "Unknown";
  }
  species = "Unknown";
  ladder = "";
  health = "Unknown";
  type = "Woody | Herbacious";
  image = "https://bcourses.berkeley.edu/courses/1456246/files/70229321/preview";
  customForm = "https://docs.google.com/forms/d/1Zwtl1HclR-n6zZd6pyPFEoOBEWq7d5hmP4l2NktYQFU/viewform?c=0&w=1";

  content = '<IMG BORDER="0" ALIGN="Center" SRC=' + image + ' style="width:250px;height:200px;">' +
    '<div id="content">' + '<div id="siteNotice">' + '</div>' +
    '<h2 id="firstHeading" class="firstHeading">Shrub</h2>' +
    '<div id="bodyContent">' + '<p>' +
    'Status: <b>' + health + '</b> </br>' +
    'Type: <b>' + type + '</b> </br>' +
    'Species: <b>' + species + '</b></br>' +
    'Manivured: <b>' + fuel + '</b></br>' +
    'Location: ' + coordinates + '</br></p>' +
    'Last Updated: ' + date + '</p>' +
    '<iframe src="' + customForm + '/viewform?embedded=true" width="500" height="400" >Loading...</iframe></br>';
  return content;
}

function path_content(coordinates, fuel, type, height, ladder) {

  if (type == 1) {
    fuel_desc = "Surface Material: "
    type = "Unknown";
    ladder = "";
    species = "";
    image = "https://t3.ftcdn.net/jpg/00/80/33/32/240_F_80333297_qHGRk9vWYoZ1MrNxaHDxuIzTPi4kclBJ.jpg";
  }


  content = 'TBA';
  return content;
}

function street_view(coordinates) {

    
    }