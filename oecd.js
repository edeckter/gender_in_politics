var w=1000;
            var h=600;
            var xPadding=50;
            var yPadding=50;
            
            //Data for drop-down
            var drop_down=[{key: 1, value: "Unpaid Work Performed by Women (Minutes per Day)"},
                            {key: 2, value: "Unpaid Work Performed by Men (Minutes per Day)"},
                            {key: 3, value: "Difference in Unpaid Work Performed by Women and Men (Minutes per Day)"},
                            {key: 4, value: "% of Unpaid Work Performed by Women"},
                            {key: 5, value: "% of Parliamentarians That are Women"}];
            
                      
            //Format values to x.x%
            var formatPercent=d3.format(".1%");
            
            //Use Equirectangular projection and center in svg
            var projection=d3.geoEquirectangular()
                             //.translate([w/2,h/2])
                             .scale(175);
                             
            //Center of world map
            var center=projection([-100,0]);
                                            
            //Color scales                      
            var colorScale=d3.scaleQuantile()
                       .range(d3.schemeBlues[9]);         
            
            //Load data
            d3.csv("Women Legislators.csv").then(function(women) {
                var women_domain=[];
                var men_domain=[];
                var diff_domain=[];
                var percent_domain=[];
                var percent_female=[];
                for (var i=0;i<women.length;i++) {
                    women_domain.push(parseFloat(women[i].Women));
                    men_domain.push(parseFloat(women[i].Men));
                    diff_domain.push(parseFloat(women[i].Diff));
                    percent_domain.push(parseFloat(women[i].PercentWomen));
                    percent_female.push(parseFloat(women[i].FemaleParlimentarians));
                };
                
                //Set initial domain for women variable
                colorScale.domain(women_domain);          

                //Load world map GeoJSON file 
                d3.json("ne_50m_admin_0_countries.geojson").then(function(world) {
                    //Loop through csv to attach data to GeoJSON
                    for (var i=0;i<women.length;i++) {
                        //ISO Country code
                        var CountryCode=women[i].CountryCode;
                        
                        //Data values to append
                        var Men=parseFloat(women[i].Men);
                        var Women=parseFloat(women[i].Women);
                        var Diff=parseFloat(women[i].Diff);
                        var Percent=parseFloat(women[i].PercentWomen);
                        var Legislators=parseFloat(women[i].FemaleParlimentarians);
                        
                        for (var j=0;j<world.features.length;j++) {
                            var ISO_A3=world.features[j].properties.ADM0_A3;
                                                        
                            if (ISO_A3==CountryCode) {
                                world.features[j].properties.Men=Men;
                                world.features[j].properties.Women=Women;
                                world.features[j].properties.Diff=Diff;
                                world.features[j].properties.PercentWomen=Percent;
                                world.features[j].properties.Legislators=Legislators;
                                break;
                            }
                        }
                        
                    }
                    
                    //Define dragging behavior
                    var zooming=function(d) {
                        //console.log("Before: "+d3.event.transform);
                        //Define new offset position
                        var offset=[d3.event.transform.x, d3.event.transform.y];
                        
                        //New scale
                        var newScale = d3.event.transform.k * 2000;

                        //Update offset
                        projection.translate(offset)
                                  .scale(newScale);
                        //Update map
                        map.selectAll("path")
                           .attr("d",path);
                        //console.log("After: "+d3.event.transform);
                    };

                    //Define drag
                    var zoom=d3.zoom()
                                 .on("zoom", zooming);
                                 
                    //Create drop-down menu
                    var menu=d3.select("#map")
                               .append("select")
                               .attr("id","map_control")
                               .on("change",function() {updateData();});

                    menu.selectAll("option")
                        .data(drop_down)
                        .enter()
                        .append("option")
                        .text(function(d) {return d.value;});

                    //Create svg for map
                    var svg1=d3.select("#viz1")
                      .append("svg")
                      .attr("width",w)
                      .attr("height",h)
                      .attr("class","map");
                    
                    //Create group for map in the DOM
                    var map=svg1.append("g")
                       .attr("class","world_map")
                       .call(zoom);
							//.translate(-center[0], -center[1]));
                       
                    //Add invisible rectangle that covers entire SVG to catch all drag/zoom events
                    map.append("rect")
                       .attr("x",0)
                       .attr("y",0)
                       .attr("width",w)
                       .attr("height",h)
                       .attr("opacity",0);
                       
                    //Draw path using projection
                    var path=d3.geoPath(projection);
                        
                    //Draw map
                    map.selectAll("path")
                        .data(world.features)
                        .enter()
                        .append("path")
                        .attr("d",path)
                        .style("stroke","#585858")
                        .style("fill",
                            function(d) {
                                var display_value=d.properties.Women;
                                if(display_value) {return colorScale(display_value);
                                } else {return "#ccc";}
                                
                            })
                        .append("title")
                        .text(function(d) {
                            var display_value=d.properties.Women;
                            return d.properties.ADMIN+" "+display_value;});
                    
                    //Set initial zoom and translate
                    map.call(zoom.transform, 
                                    d3.zoomIdentity.translate(w/2, h/2)
                                                   .scale(0.08)
                                                   .translate(-center[0],-center[1]));
                                                   
                    //Reset map to original zoom
                    //Create button
                    var reset=svg1.append("g")
                                    .attr("class","reset");
                    
                    //Draw reset zoom button
                    reset.append("rect")
                       .attr("x",80)
                       .attr("y",h-yPadding)
                       .attr("width",100)
                       .attr("height",yPadding/2)
                       .style("fill","white")
                       .style("stroke","black")
                    //Text for button   
                    reset.append("text")
                           .attr("x",90)
                           .attr("y",h-3*yPadding/4)
                           .text("Reset Zoom")
                           .attr("text-anchor","start")
                           .attr("dominant-baseline","central");
                    //Click action (reset value)
                    d3.selectAll(".reset")
                      .on("click", function() {
                            map.call(zoom.transform, 
                                    d3.zoomIdentity.translate(w/2, h/2)
                                                   .scale(0.08)
                                                   .translate(-center[0],-center[1]));
                       });
                    
                    //Zoom buttons
                    var zoomIn=svg1.append("g")
                                   .attr("class","zoom")
                                   .attr("id","in");
                                   
                    zoomIn.append("rect")
                           .attr("x",0)
                           .attr("y",h-yPadding)
                           .attr("width",30)
                           .attr("height",yPadding/2)
                           .style("fill","white")
                           .style("stroke","black");
                    
                    zoomIn.append("text")
                           .attr("x",15)
                           .attr("y",h-3*yPadding/4)
                           .text("+")
                           .attr("text-anchor","middle")
                           .attr("dominant-baseline","central");
                           
                    var zoomOut=svg1.append("g")
                                   .attr("class","zoom")
                                   .attr("id","out");
                                   
                    zoomOut.append("rect")
                           .attr("x",40)
                           .attr("y",h-yPadding)
                           .attr("width",30)
                           .attr("height",yPadding/2)
                           .style("fill","white")
                           .style("stroke","black");
                    
                    zoomOut.append("text")
                           .attr("x",55)
                           .attr("y",h-3*yPadding/4)
                           .text("-")
                           .attr("text-anchor","middle")
                           .attr("dominant-baseline","central");

                    var fixedZoom=function() {
                        var scaleFactor;
                        var type=d3.select(this).attr("id");
                        if (type=="in") {
                            scaleFactor=1.5;
                        } else {scaleFactor=0.75;}
                        
                        map.call(zoom.scaleBy,scaleFactor);
                    };
                    
                    //Assign action to zoom buttons
                    d3.selectAll(".zoom")
                      .on("click",fixedZoom);

                    //Draw legend
                    var legend=svg1.append("g")
                                   .attr("class","legend");
                                       
                    legend.selectAll("rect")
                          .data(colorScale.range())
                          .enter()
                          .append("rect")
                          .attr("x",function(d,i) {return i*(w-2*xPadding)/colorScale.range().length;})
                          .attr("y",yPadding/4)
                          .attr("width",yPadding/2)
                          .attr("height",yPadding/2)
                          .style("stroke","#585858")
                          .style("fill",function(d) {return d;});
                            
                    var max=d3.max(colorScale.domain());
                    breaks=colorScale.quantiles().concat(max);
                    legend.selectAll("text")
                          .data(breaks)
                          .enter()
                          .append("text")
                          .attr("x",function(d,i) {return yPadding/2+5+i*(w-2*xPadding)/colorScale.range().length;})
                          .attr("y",yPadding/2)
                          .attr("text-anchor","start")
                          .attr("dominant-baseline","central")
                          .text(function(d) {return "≤"+Math.round(d,0);});
                    
                    var updateData=function(d) {
                        var selected=d3.select("select#map_control").property("value");
             
                        //Add/update colors and tooltips
                        map.selectAll("path")
                           .style("fill",
                            function(d) {
                                switch(selected) {
                                    case "Unpaid Work Performed by Men (Minutes per Day)":
                                        colorScale.domain(men_domain);
                                        display_value=d.properties.Men;
                                        break;
                                    case "Unpaid Work Performed by Women (Minutes per Day)":
                                        colorScale.domain(women_domain);
                                        display_value=d.properties.Women;
                                        break;
                                    case "Difference in Unpaid Work Performed by Women and Men (Minutes per Day)":
                                        colorScale.domain(diff_domain);
                                        display_value=d.properties.Diff;
                                        break;
                                    case "% of Unpaid Work Performed by Women":
                                        colorScale.domain(percent_domain);
                                        display_value=d.properties.PercentWomen;
                                        break;
                                    case "% of Parliamentarians That are Women":
                                        colorScale.domain(percent_female);
                                        display_value=d.properties.Legislators;
                                        break;
                                    default: break;
                                };
                                
                                if(display_value) {return colorScale(display_value);
                                } else {return "#ccc";}
                                
                            })
                           .selectAll("title")
                           .text(function(d) {
                                    switch(selected) {
                                    case "Unpaid Work Performed by Men (Minutes per Day)":
                                        display_value=d.properties.Men;
                                        break;
                                    case "Unpaid Work Performed by Women (Minutes per Day)":
                                        display_value=d.properties.Women;
                                        break;
                                    case "Difference in Unpaid Work Performed by Women and Men (Minutes per Day)":
                                        display_value=d.properties.Diff;
                                        break;
                                    case "% of Unpaid Work Performed by Women":
                                        if (typeof d.properties.PercentWomen=='undefined') {
                                            display_value='Undefined';
                                        } else {
                                            display_value=formatPercent(d.properties.PercentWomen);
                                        }
                                        break;
                                    case "% of Parliamentarians That are Women":
                                        if (typeof d.properties.Legislators=='undefined') {
                                            display_value='Undefined';
                                        } else {
                                            display_value=formatPercent(d.properties.Legislators);
                                        }
                                        break;
                                    default: break;
                                };
                                
                                return d.properties.ADMIN+" "+display_value;})
                            
                            //Update legend values
                            var max=d3.max(colorScale.domain());
                            breaks=colorScale.quantiles().concat(max);
                            legend.selectAll("text")
                                  .data(breaks)
                                  .text(function(d) {
                                    if (selected=="% of Unpaid Work Performed by Women" || selected=="% of Parliamentarians That are Women")
                                        {return "≤"+formatPercent(d);} else {return "≤"+Math.round(d,0);}
                                  });
                        };
                });
            });
            
            //Bar chart
            var bw=750;
 
            var svg2=d3.select("#viz2")
                       .append("svg")
                       .attr("width",bw)
                       .attr("height",h)
                       .attr("class","plot");
                        
            d3.csv("Women Legislators.csv").then(function(women) {
                //Initial sort
                women.sort(function(a,b) {
                    return d3.descending(b.FemaleParlimentarians,a.FemaleParlimentarians);
                });

                //Create drop-down menu
                var menu2=d3.select("#chart")
                            .append("select")
                            .attr("id","chart_control")
                            .on("change",function() {sortBars();});

                var sortData=["% of Female Legislators","% of Unpaid Work by Women","Country"];
                menu2.selectAll("option")
                     .data(sortData)
                     .enter()
                     .append("option")
                      .text(function(d) {return d;});
                      
                //Create key
                var key=function(d) {return women.Country;};
                
                //Labels for plots
                svg2.append("text")
                    .attr("x",bw/2-10)
                    .attr("y",yPadding/2)
                    .text("% of Unpaid Work Performed by Females")
                    .attr("text-anchor","end")
                    .attr("dominant-baseline","central")
                    .attr("font-weight","bold");
                
                svg2.append("text")
                    .attr("x",bw/2+10)
                    .attr("y",yPadding/2)
                    .text("% of Parliamentarians that are Female")
                    .attr("text-anchor","start")
                    .attr("dominant-baseline","central")
                    .attr("font-weight","bold");
                    
                //Scaling function for categories
                var heightScale=d3.scaleBand()
                             .domain(d3.range(women.length))
                             .rangeRound([h-yPadding,yPadding])
                             .paddingInner(0.05);
                      
                //Scaling function for bars
                var widthScale=d3.scaleLinear()
                                 .domain([0,1])
                                 .range([xPadding,bw/2]);
                
                //Create group for unpaid labor bar chart
                var labor=svg2.append("g")
                              .attr("id","unpaid");
                              
                //Create bars for unpaid work %            
                labor.selectAll("rect")
                   .data(women,key)
                   .enter()
                   .append("rect")
                   .attr("class","bars")
                   .attr("x",function(d) {return bw/2-widthScale(d.PercentWomen);})
                   .attr("y",function(d,i) {return heightScale(i);})
                   .attr("height",heightScale.bandwidth())
                   .attr("width",function(d) {return widthScale(d.PercentWomen);})
                   .style("fill",function(d) {return "rgb("+d.PercentWomen*200+",0,0)";});
                   
                
                //Create labels for unpaid work %              
                labor.selectAll("text")
                   .data(women,key)
                   .enter()
                   .append("text")
                   .attr("class","labels")
                   .attr("x",function(d) {return bw/2-widthScale(d.PercentWomen)+10;})
                   .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;})
                   .text(function(d) {return formatPercent(d.PercentWomen);})
                   .style("fill","white")
                   .attr("text-anchor","start")
                   .attr("dominant-baseline","central");
                   
                //Create group for unpaid labor bar chart
                var legislators=svg2.append("g")
                              .attr("id","legislators");
                
                //Create bars for female legislators           
                legislators.selectAll("rect")
                   .data(women,key)
                   .enter()
                   .append("rect")
                   .attr("class","bars")
                   .attr("x",bw/2)
                   .attr("y",function(d,i) {return heightScale(i);})
                   .attr("height",heightScale.bandwidth())
                   .attr("width",function(d) {return widthScale(d.FemaleParlimentarians);})
                   .style("fill",function(d) {return "rgb(0,0,"+d.FemaleParlimentarians*200+")";});
                   
                //Create labels for unpaid work %              
                legislators.selectAll("text")
                   .data(women,key)
                   .enter()
                   .append("text")
                   .attr("class","labels")
                   .attr("x",function(d) {return bw/2+widthScale(d.FemaleParlimentarians)-10;})
                   .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;})
                   .text(function(d) {return formatPercent(d.FemaleParlimentarians);})
                   .style("fill","white")
                   .attr("text-anchor","end")
                   .attr("dominant-baseline","central");
                   
                //Create group for unpaid labor bar chart
                var y_axis=svg2.append("g")
                               .attr("id","y-axis");
                
                //Add y-axis
                y_axis.selectAll("text")
                   .data(women,key)
                   .enter()
                   .append("text")
                   .attr("class","country_labels")
                   .attr("x",bw/2)
                   .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;})
                   .text(function(d) {return d.Country;})
                   .style("fill","white")
                   .attr("text-anchor","middle")
                   .attr("dominant-baseline","central");
                
                y_axis.append("line")
                    .attr("x1",bw/2)
                    .attr("y1",yPadding)
                    .attr("x2",bw/2)
                    .attr("y2",h-yPadding)
                    .style("stroke","white");
                    
                var sortBars=function() {
                    var sort_order=d3.select("select#chart_control").property("value");
                    
                    if (sort_order=="% of Female Legislators") {
                        labor.selectAll("rect")
                             .sort(function(a,b) {
                                return d3.descending(b.FemaleParlimentarians,a.FemaleParlimentarians);})
                             .transition()
                             .duration(1000)
                             .attr("y",function(d,i) {return heightScale(i);});
                          
                        labor.selectAll("text")
                             .sort(function(a,b) {
                                return d3.descending(b.FemaleParlimentarians,a.FemaleParlimentarians);})
                             .transition()
                             .duration(1000)
                             .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;});
                             
                        legislators.selectAll("rect")
                                   .sort(function(a,b) {
                                        return d3.descending(b.FemaleParlimentarians,a.FemaleParlimentarians);})
                                    .transition()
                                    .duration(1000)
                                    .attr("y",function(d,i) {return heightScale(i);});
                                    
                        legislators.selectAll("text")
                                   .sort(function(a,b) {
                                        return d3.descending(b.FemaleParlimentarians,a.FemaleParlimentarians);})
                                   .transition()
                                   .duration(1000)
                                   .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;});
                                   
                        y_axis.selectAll("text")
                              .sort(function(a,b) {
                                        return d3.descending(b.FemaleParlimentarians,a.FemaleParlimentarians);})
                              .transition()
                              .duration(1000)
                              .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;});
                    } else if (sort_order=="% of Unpaid Work by Women") {
                        labor.selectAll("rect")
                             .sort(function(a,b) {
                                return d3.descending(b.PercentWomen,a.PercentWomen);})
                             .transition()
                             .duration(1000)
                             .attr("y",function(d,i) {return heightScale(i);});
                          
                        labor.selectAll("text")
                             .sort(function(a,b) {
                                return d3.descending(b.PercentWomen,a.PercentWomen);})
                             .transition()
                             .duration(1000)
                             .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;});
                             
                        legislators.selectAll("rect")
                                   .sort(function(a,b) {
                                        return d3.descending(b.PercentWomen,a.PercentWomen);})
                                    .transition()
                                    .duration(1000)
                                    .attr("y",function(d,i) {return heightScale(i);});
                                    
                        legislators.selectAll("text")
                                   .sort(function(a,b) {
                                        return d3.descending(b.PercentWomen,a.PercentWomen);})
                                   .transition()
                                   .duration(1000)
                                   .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;});
                                   
                        y_axis.selectAll("text")
                              .sort(function(a,b) {
                                        return d3.descending(b.PercentWomen,a.PercentWomen);})
                              .transition()
                              .duration(1000)
                              .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;});
                    } else if (sort_order=="Country") {
                        labor.selectAll("rect")
                             .sort(function(a,b) {
                                return d3.ascending(b.Country,a.Country);})
                             .transition()
                             .duration(1000)
                             .attr("y",function(d,i) {return heightScale(i);});
                          
                        labor.selectAll("text")
                             .sort(function(a,b) {
                                return d3.ascending(b.Country,a.Country);})
                             .transition()
                             .duration(1000)
                             .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;});
                             
                        legislators.selectAll("rect")
                                   .sort(function(a,b) {
                                        return d3.ascending(b.Country,a.Country);})
                                    .transition()
                                    .duration(1000)
                                    .attr("y",function(d,i) {return heightScale(i);});
                                    
                        legislators.selectAll("text")
                                   .sort(function(a,b) {
                                        return d3.ascending(b.Country,a.Country);})
                                   .transition()
                                   .duration(1000)
                                   .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;});
                                   
                        y_axis.selectAll("text")
                              .sort(function(a,b) {
                                        return d3.ascending(b.Country,a.Country);})
                              .transition()
                              .duration(1000)
                              .attr("y",function(d,i) {return heightScale(i)+heightScale.bandwidth()/2;});

                    };
                };
            });
                