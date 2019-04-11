var h=800
var w=800
var xPadding=75
var yPadding=50

var tooltip=d3.select("#viz3")
              .append("div")
              .style("position","absolute")
              .style("opacity",0)
              .style("background-color","white")
              .style("border", "solid")
              .style("border-width", "2px")
              .style("border-radius", "2px")
              .style("padding","2px")
              .style("pointer-events","none")
              .style("z-index","999");

var svg=d3.select("#viz3")
          .append("svg")
          .attr("width",w)
          .attr("height",h);         
         
//Scaling function for x-axis
var xScale=d3.scaleLinear()
              .range([xPadding,w-xPadding]);
            
//Scaling function for y-axis            
var yScale=d3.scaleLinear()
             .range([h-yPadding,yPadding]);                        

//Format values to x.x%
var formatPercent=d3.format(".1%");            

//Create x-axis
var xAxis=d3.axisBottom()
            .scale(xScale)
            .tickFormat(d3.format(".0%"));
                        
//Create y-axis
var yAxis=d3.axisLeft()
            .scale(yScale)
            .tickFormat(d3.format(".0%"));
            
//Load csv data
d3.csv("Women Legislators.csv").then(function(women) {
    xScale.domain([0.5,d3.max(women,function(d) {return d.PercentWomen;})])
          .nice()
    yScale.domain([0,d3.max(women,function(d) {return d.FemaleParlimentarians;})])
          .nice()
    
    //Draw scatterplot points
    var points=svg.append("g")
                  .attr("class","points");
                  
    points.selectAll("circle")
          .data(women)
          .enter()
          .append("circle")
          .attr("cx",function(d) {return xScale(d.PercentWomen);})
          .attr("cy",function(d) {return yScale(d.FemaleParlimentarians);})
          .attr("r",5)
          .attr("stroke","black")
          .on("mouseover",function(d) {
                d3.select(this)
                  .attr("fill","none");
                var drop_lines=svg.append("g")
                                  .attr("class","drop-lines")

                drop_lines.append("line")
                   .attr("x1",d3.select(this).attr("cx"))
                   .attr("x2",d3.select(this).attr("cx"))
                   .attr("y1",yScale(0))
                   .attr("y2",d3.select(this).attr("cy"))
                   .style("stroke-dasharray","10,10")
                   .style("stroke","#585858");
                   
                drop_lines.append("line")
                   .attr("x1",xPadding)
                   .attr("x2",d3.select(this).attr("cx"))
                   .attr("y1",d3.select(this).attr("cy"))
                   .attr("y2",d3.select(this).attr("cy"))
                   .style("stroke-dasharray","10,10")
                   .style("stroke","#585858");
                
                //Add custom tooltip
                tooltip.style("opacity",1)
                       .html(d.Country)
                       .style("left",d3.event.pageX+5+"px")
                       .style("top",d3.event.pageY+5+"px");
          })
          .on("mouseout",function() {
              d3.select(this).attr("fill","black");
              d3.selectAll(".drop-lines")
                .remove();
              tooltip.style("opacity",0);
          });
       
    //Draw axes
    //Display x-axis
    svg.append("g")
       .attr("class","axis")
       .attr("transform","translate(0,"+(h-yPadding)+")")
       .call(xAxis);
               
    //Display y-axis
    svg.append("g")
        .attr("class","axis")
        .attr("transform","translate("+xPadding+",0)")
        .call(yAxis);
        
    //Add axis labels
    var axisLabels=svg.append("g")
                      .attr("class","axis-labels");
    axisLabels.append("text")
              .attr("x",(w-xPadding)/2)
              .attr("y",h-yPadding/4)
              .text("% of Unpaid Work Performed by Women")
              .attr("text-anchor","middle")
              .attr("dominant-baseline","central");
       
    axisLabels.append("text")
              .attr("x",-(h-2*yPadding)/2)
              .attr("y",xPadding/4)
              .text("% of Parliamentarians that are Women")
              .attr("text-anchor","middle")
              .attr("dominant-baseline","central")
              .attr("transform","rotate(-90)");
       
    //Add chart title
    var title=svg.append("g")
                 .attr("class","title")
    
    title.append("text")
         .attr("x",xPadding)
         .attr("y",yPadding/2)
         .text("National Attitudes on Gender Roles in Domestic Labor Color Attitudes on Gender Roles in Politics")
         .attr("font-weight","bold");
    
    //Toggle regression line
    var regressionLineState=0;
    var regression=svg.append("g")
                      .attr("class","regression");
    regression.append("rect")
       .attr("x",xScale(0.51))
       .attr("y",yScale(0.025))
       .attr("width",200)
       .attr("height",30)
       .attr("fill","none")
       .attr("stroke","black");
       
    regression.append("text")
       .attr("x",xScale(0.51)+100)
       .attr("y",yScale(0.025)+15)
       .text("Add Regression Line")
       .attr("text-anchor","middle")
       .attr("dominant-baseline","central")
       .on("click",function() {regressionLine();});
       
    var regressionLine=function() {
        if (regressionLineState==0) {
            regressionLineState=1;
            regression.append("line")
               .attr("x1",xScale(0.50))
               .attr("x2",xScale(0.85))
               .attr("y1",yScale(0.4129172))
               .attr("y2",yScale(0.1548544))
               .style("stroke","blue")
               .style("stroke-dasharray","5,5");
               
            d3.select(".regression")
              .select("text")
              .text("Remove Regression Line");
        } else {
            regressionLineState=0;
            d3.select(".regression")
              .selectAll("line")
              .remove();
            d3.select(".regression")
              .select("text")
              .text("Add Regression Line");
        }
    };
});