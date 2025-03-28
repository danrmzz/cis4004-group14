const statsBox = document.getElementsByClassName("budgetTextContainer");

//function needed to access database

google.charts.load("current", {packages:["corechart"]});
google.charts.setOnLoadCallback(drawChart);
function drawChart() {
var data = google.visualization.arrayToDataTable([
    ['Task', 'Hours per Day'],
    ['Work',     11],
    ['Eat',      2],
    ['Commute',  2],
    ['Watch TV', 2],
    ['Sleep',    7]
]);

var options = {
    legend: 'bottom',
    title: 'Current Budget',
    pieHole: 0.55,
};

var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
    chart.draw(data, options);
}