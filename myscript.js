$( document ).ready(function() {

//arrays to hold data once it's loaded in from the csv
var alldata = [];
var currdata = [];
var countryNames = [];
var countryCodes = [];
var ctyName = "";

//margin object
var margin= {top:100, bottom:100, right:150, left:50};
//width and height are the inner dimensions of chart area
var height = 800 - margin.top - margin.bottom,
    width = 1200 - margin.left - margin.right;

//scales for x and y variables so they don't go off the page. domain defined after data is imported
var yScale = d3.scale.linear().range([height,0]);
var xScale = d3.time.scale().range([0, width]);

//creates a list for the dropdown options bar out of all of the different country names.
function addList(){
    var select = document.getElementById("country");
    for(var i = 0; i <= countryNames.length; ++i) {
        var option = document.createElement('option');
        option.text = option.value = countryNames[i];
        select.add(option, 0);
      }
      $('#country option[value="European Union"]').prop('selected',true); //sets the selected country to be EU
     }

//when a new country is selected, this function removes all objects with the class "currValue" and calls drawChart with the ctycode of the country selected.
$("#country").change(function(){
    $("#country option:selected").each(function(){
        var newCountry=$(this).text();
        var index= countryNames.indexOf(newCountry);
        d3.selectAll(".currValue").remove();
        drawChart(countryCodes[index]);
    })    
})

//creating the "canvas" to draw on. an svg element
var canvas = d3.select('#canvasSVG')//.append('svg') normally you append svg to a div here, 
//but due to the fade-in functionality, we had to create the svg in the .html file
    //.style('background', 'mistyrose')
    .style('background-image',"url('bkg.jpg')")
    .style('background-size',"1200px 800px")
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    //.attr("filter", "url(#inset-shadow-rose)")
    

//rectangular borders around graph
canvas.append('rect')
    .attr("height", height)
    .attr("width", width+70) //border around y-axis
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
canvas.append('rect') //inner border
    .attr("height", height + 100)
    .attr("width", width+150) 
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("transform", "translate(" + 25+ "," + 25 + ")")
canvas.append('rect') //outer border
    .attr("height", height + 110)
    .attr("width", width+160) 
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("transform", "translate(" + 20 + "," + 20 + ")")

//creates a group called chart which will be what the lines and areas are attached to.
var chart = canvas.append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")") //translate origin to top left corner of chart area
        .attr("id","chart")

//load data
d3.csv("all_import_export_country.csv", function(error,data){
    if(error){
            console.log(error);
    }
    else{
        alldata = data;
        data.forEach(function(d){ //add unique countries to an array
            if(countryNames.indexOf(d.CTYNAME) == -1)
            {
                countryNames.push(d.CTYNAME);
                countryCodes.push(d.CTYCODE);
            }
        })
        addList();
        drawChart(3); //to draw the current chart
    }
});

function drawChart(ctyCode){
    //filter the data to only include entries where CTYCODE is the one the user specified
    currdata = alldata.filter(function(element) {return element.CTYCODE == ctyCode;})
    ctyName = currdata[0].CTYNAME

    //get min and max values for year and $ exported/imported to define graph axis domains
    xmin = 5000;
    xmax = 0;
    ymax = 0;
    for (i in currdata)
    {
        if(currdata[i].year > xmax)
            xmax = currdata[i].year
        if(currdata[i].year < xmin)
            xmin = currdata[i].year
        if(Math.max(currdata[i].IYR,currdata[i].EYR) > ymax)
        {
            ymax = Math.max(currdata[i].IYR,currdata[i].EYR)}
    }

    //set up variables for scales: string-->number-->date
    var minYear = new Date(Number(xmin),0,1); //months index from 0, days from 1
    var maxYear = new Date(Number(xmax),0,1);

    //set x and y scale domain now that we know the data
    xScale.domain([minYear,maxYear]); //scale of x axis changes based on earliest and latest year with data
    yScale.domain([0, ymax]); //scale of y axis changes based on the largest import or export value
   
//*********************************************CREATE LINES************************************//
//function telling d3 where we want the line's x and y values to come from
    var exportLine = d3.svg.line()
                        .x(function(d){
                            return xScale(new Date(d.year,0,1));})
                        .y(function(d){return yScale(d.EYR);})
                        .interpolate('basis');

    var importLine = d3.svg.line()
                        .x(exportLine.x())
                        .y(function(d){return yScale(d.IYR);})
                        .interpolate('basis');

//append a d3 path with the data passed into our line function
    chart.append("path")
        .attr("stroke", "darkRed")
        .attr("stroke-width", 5)
        .attr("fill", "none")
        .attr("class", "currValue") //now the path can be removed by selecting all elements with this id
        .attr("id", "exportTextPath")
        .attr("d", exportLine(currdata));

    chart.append("path")
        .attr("stroke", "gold")
        .attr("stroke-width", 5)
        .attr("fill", "none")
        .attr("class", "currValue")
        .attr("id", "importTextPath")
        .attr("d", importLine(currdata));

    chart.append("path")
        .attr("stroke", "#000000")
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("class","currValue")
        .attr("d", exportLine(currdata));

    chart.append("path")
        .attr("stroke", "#000000")
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("class", "currValue")
        .attr("d", importLine(currdata));

//****************************CREATE AREA BETWEEN LINES************************************//
    
    //define areas
    var areaAboveImportLine = d3.svg.area()
                                .x(importLine.x())
                                .y0(importLine.y())
                                .y1(0)
                                .interpolate("basis");
    var areaBelowImportLine = d3.svg.area()
                                .x(importLine.x())
                                .y0(importLine.y())
                                .y1(height)
                                .interpolate("basis");
    var areaAboveExportLine = d3.svg.area()
                                .x(exportLine.x())
                                .y0(exportLine.y())
                                .y1(0)
                                .interpolate("basis");
    var areaBelowExportLine = d3.svg.area()
                                .x(exportLine.x())
                                .y0(exportLine.y())
                                .y1(height)
                                .interpolate("basis");

      //populate the defs html tag                          
    var defs = chart.append('defs').attr("class", "currValue"); //defs is a d3 tag just like svg, path, or rect

    //add some clipPaths inside defs
    defs.append("clipPath")
        .attr("id", "clip-import")
        .attr("class", "currValue")
        .append("path")
        .datum(currdata)
        .attr("d", areaAboveImportLine);

    defs.append("clipPath")
        .attr("id", "clip-export")
        .attr("class","currValue")
        .append("path")
        .datum(currdata)
        .attr("d", areaAboveExportLine);

    //draw the areas
    chart.append("path")
            .datum(currdata) //must use datum not data
            .attr("d", areaBelowImportLine)
            .attr("clip-path", "url(#clip-export)") //the URL is the id of the clipPath
            .attr("class", "currValue")
            .attr("fill", "pink") //fill color when imports>export
            .attr("opacity", .5);

    chart.append("path")
            .attr("d", areaBelowExportLine(currdata)) //instead of using "datum", you can also pass in currdata to the line function
            .attr("clip-path", "url(#clip-import)")
            .attr("class", "currValue")
            .attr("fill", "green") //fill color when exports>imports
            .attr("opacity", .5);

//*********************************************CREATE AXIS************************************//
//create axis with our x and y scales
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('right')
        .ticks(20)
        .tickSize(-width,0,0) //creates a grid by making the ticks the width of the chart

    //append a group for y axis
    var yGuide = canvas.append('g')//use the yGuide variable to actually display the axis in the chart
        .attr('transform','translate('+ (width + margin.left) + ',' + margin.top + ')')
        .attr("class",'currValue y axis')
        .call(yAxis)
        //yAxis.ticks() returns an array with one element equal to the number of ticks
        //console.log("all the points", yAxis.scale().ticks(yAxis.ticks()[0]));

    //make every 5th tick have a thicker stroke. TODO: actually every whole million
    d3.selectAll("g.y.axis g.tick") //select all g elements with both class y and axis, and g elements with class tick
        .style("stroke-width",function(d,i){
            if(i%5 == 0)
                return 2;
        })

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .tickSize(-height,0,-height)
    //append a group for x axis
    var xGuide = canvas.append('g')
        .attr('transform','translate('+ margin.left + ',' + (height + margin.top) + ')')
        .attr("class",'currValue x axis')
        .call(xAxis) //.call is what displays the ticks and labels

    //abbreviated years as labels
    d3.selectAll("g.x.axis g.tick").selectAll("text").remove() //remove tick labels
    d3.selectAll("g.x.axis g.tick")
        .append("text") //add back re-formated tick labels
        .attr("dy",15)
        .text(function(d){ //d for ticks is the value of the tick
            if (Number(d.getYear()) % 100 != 0)
                return d.getFullYear().toString().substr(2) //display the last two digits of the year
            else
                return d.getFullYear()
        })

    //axis labels
    var rotateTranslate = d3.svg.transform().rotate(-90).translate(-height/2,-7); //translate method defined with parameters y,x and in cartesian coordinate plane
    chart.append('text')
        .attr('text-anchor','middle')
        .attr('transform',rotateTranslate) //text must be rotate parallel to y-axis
        .style("font-weight","bold") //alternatively, could have added a class and styled in mystyle.css
        .text('Money (millions of dollars)') //labeled w/millions instead of formatting y-axis b/c easier
    chart.append('text')
        .attr('text-anchor','middle')
        .attr('transform','translate(' + width/2 + ',' + -25 + ')')
        .style("font-weight","bold")
        .text('Time')



//*********************************************WRITE TEXT************************************//
    //TODO: text in area. "BALANCE in FAVOR of USA" (not possible)
    //TODO: change offset based on intersection of paths. (not possible)

    //text along line graph
    var expText = chart.append('text').attr("dy", "-10px")
    var impText = chart.append('text').attr("dy", "-10px")

    expText.append('textPath')
        .attr("class","currValue")
        .attr("xlink:href","#exportTextPath")
        .attr("startOffset","20%")
        .style("font-style",'italic')
        .style("font-size",'20px')
        .text("Line of Exports from USA")

    impText.append('textPath')
        .attr("class","currValue")
        .attr("xlink:href","#importTextPath")
        .attr("startOffset","60%")
        .style("font-style",'italic')
        .style("font-size",'20px')
        .text("Line of Imports to USA") //must say to USA b/c we cant put the "in favor of" text in the area

//make a pattern for circle bkg. this is how you add a background to an svg element
    defs.append("pattern")
        .attr("id","bkg")
        .attr("patternUnits","userSpaceOnUse")
        .attr("width",700)
        .attr('height',700)
        .append("image")
            .attr("xlink:href","bkg.jpg")
            .attr('width',700)
            .attr('height',700)
            .attr('y',-100)
    //circle with title text
    var title = canvas.append("g")
    title.append("ellipse")
            .attr("id", "currValue")
            .attr("cx", 200)
            .attr("cy", 150)
            .attr("rx", 170)
            .attr("ry",120)
            .attr("fill", "url(#bkg)")
            .attr("stroke", "black")
            .attr("stroke-width", 1);
    title.append("text")
        .attr('text-anchor','middle')
        .attr('transform','translate(' + 200 + ',' + 115 + ')')
        .style('font-family','oldschool')
        .style('font-size','30px')
        .text("Exports and Imports")
    title.append("text")
        .attr('text-anchor','middle')
        .attr('transform','translate(' + 200 + ',' + 150 + ')')
        .style('font-family','cursive')
        .style('font-size','40px')
        .text("to and from all")
    title.append("text")
        .attr('text-anchor','middle')
        .attr('transform','translate(' + 200 + ',' + 200 + ')')
        .style('font-family','oldschool')
        .style('font-size','30px')
        .text(ctyName)

 } //end drawChart


});
