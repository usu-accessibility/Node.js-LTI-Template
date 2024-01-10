import React, { useState, useEffect , useRef, useCallback } from 'react';
import {Button, Tooltip, Table, ScreenReaderContent} from "@instructure/ui";
import axios from 'axios';

export default function CoursesTable({basePath, courses, loadTable, setCourses, handleReview, setIsLoading, setPushMessage, handlePublish, courseFilter, setPageNumber, pageNumber}) {
  const [sortBy, setSortBy] = useState();
  const [ascending, setAscending] = useState(true);

  const [noOfImages, setNoOfImages] = useState(0);
  const [completedImages, setCompletedImages] = useState(0);
  const [publishedImages, setPublishedImages] = useState(0);
  const [imagesToPublish, setImagesToPublish] = useState(0);
  const [advancedImagesToPublish, setAdvancedImagesToPublish] = useState(0);
  const [availableToPublish, setAvailableToPublish] = useState(0);

  const direction = ascending ? 'ascending' : 'descending';
  
  const observer = useRef();
  const lastTableElement = useCallback(row => {

    if(observer.current){
      observer.current.disconnect();
    }
    
    observer.current = new IntersectionObserver(entries => {
      if(entries[0].isIntersecting){
        setPageNumber(pageNumber + 1);
        // loadTable();
      }
    })

    if(row){
      observer.current.observe(row);
    }

  });

  useEffect(() => {    
    loadTable();
  }, []);

  useEffect(() => {

    var val1 = 0;
    var val2 = 0;
    var val3 = 0;
    var val4 = 0;
    var val5 = 0;
    var val6 = 0;

    axios.get(
      `${basePath}/get_courses_content_count?filterText=${courseFilter}`
    )
    .then((response) => {

      var loadJson = {};

      if(typeof response.data === "string"){
        const jsonRegex = /\[.*\]/;
        const jsonMatch = response.data.match(jsonRegex);

        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          loadJson = JSON.parse(jsonString)[0];
        }
      }
      else {
        loadJson = response.data[0];
      }

      console.log(loadJson);

      setNoOfImages(parseInt(loadJson.total_images ? loadJson.total_images : 0));
      setCompletedImages(parseInt(loadJson.completed_images ? loadJson.completed_images : 0));
      setPublishedImages(parseInt(loadJson.published_images ? loadJson.published_images : 0));
      setImagesToPublish(parseInt(loadJson.completed_images ? loadJson.completed_images : 0) - parseInt(loadJson.published_images ? loadJson.published_images : 0));
      setAdvancedImagesToPublish(parseInt(loadJson.advanced_images ? loadJson.advanced_images : 0));
      setAvailableToPublish(parseInt(loadJson.available_images ? loadJson.available_images : 0));


    }).catch((error) => {
      console.log(error);
    })



    // (courses || []).map(course => {
    //   if(course.total_images !== course.published_images){
    //     val1 += parseInt(course.total_images);
    //     val2 += parseInt(course.completed_images);
    //     val3 += parseInt(course.published_images);
    //     val4 += parseInt(course.completed_images) - parseInt(course.published_images);
    //     val5 += parseInt(course.advanced_images);
    //     val6 += parseInt(course.available_images);
    //   }

    //   setNoOfImages(val1);
    //   setCompletedImages(val2);
    //   setPublishedImages(val3);
    //   setImagesToPublish(val4);
    //   setAdvancedImagesToPublish(val5);
    //   setAvailableToPublish(val6);
    // });
  }, [courses])

  function onSort(event, column) {
    let id = column.id;
    let localAscending;

    if (id === sortBy) {
      setAscending(!ascending);
      localAscending = !ascending;
    }
    else {
      setAscending(true);
      localAscending = true;
    }

    setSortBy(id);

    if (shouldReverse(id)) {
      let tempCourses = [...courses];
      tempCourses.sort((a, b) => {
        // console.log(a[id]);
        // console.log(typeof a[id] === "string");
        if (typeof a[id] === "string") {
          return a[id].localeCompare(b[id]);
        } else {
          return b[id] - a[id];
        }
      });

      // console.log(localAscending);
      // console.log(tempCourses);

      if (!localAscending) {
        tempCourses = tempCourses.slice().reverse();
        // console.log(tempCourses);
      }

      setCourses(tempCourses);
    }
  }

  function shouldReverse(id) {
    if (courses.length === 0 || id === undefined) {
      return false;
    }

    let val = courses[0][id];
    for (let i = 1; i < courses.length; i++) {
      if (courses[i][id] !== val) return true;
    }

    return false;
  }

  return (

    <Table caption='Courses'>
      <Table.Head renderSortLabel={<ScreenReaderContent>Sort by</ScreenReaderContent>}>
        <Table.Row>
          <Table.ColHeader 
            id='name' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'name' ? direction : 'none'}
          >
            Course Name
          </Table.ColHeader>

          <Table.ColHeader 
            id='total_images' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'total_images' ? direction : 'none'}
          >
            <Tooltip
                renderTip='Total Images in Use without Alt Text'
                as={Button}
            >
                <span> 
                  <i class="fa-solid fa-circle-info"></i> &nbsp; Total ({noOfImages})
                </span>            
            </Tooltip>
          </Table.ColHeader>

          <Table.ColHeader 
            id='completed_images' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'completed_images' ? direction : 'none'}
          >
            <Tooltip
              renderTip='Alt text added and published'
              as={Button}
            >
              <span> 
                  <i class="fa-solid fa-circle-info"></i> &nbsp; Published ({publishedImages})  
              </span>
            </Tooltip>
          </Table.ColHeader>

          <Table.ColHeader 
            id='published_images' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'published_images' ? direction : 'none'}
          >
            <Tooltip
              renderTip='Alt text has been added, but not published'
              as={Button}  
            >
              <span> 
                  <i class="fa-solid fa-circle-info"></i>  &nbsp; Ready to Publish ({imagesToPublish}) 
              </span>
            </Tooltip>
          </Table.ColHeader>

        
          <Table.ColHeader 
            id='images_to_publish' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'images_to_publish' ? direction : 'none'}
          >
            <Tooltip
              renderTip='Imaged have been marked as advanced, but do not have alt text'
              as={Button}              
            >
              <span> 
                  <i class="fa-solid fa-circle-info"></i> Advanced ({advancedImagesToPublish}) &nbsp;
              </span>
            </Tooltip>
          </Table.ColHeader>

          <Table.ColHeader 
            id='images_to_publish' 
            onRequestSort={onSort}
            sortDirection={sortBy === 'images_to_publish' ? direction : 'none'}
          >
            <Tooltip
              renderTip='Images that are currently in progress and not availalbe'
              as={Button}              
            >
                <span> 
                    <i class="fa-solid fa-circle-info"></i>  &nbsp; In Progress ({availableToPublish}) 
                </span>
            </Tooltip>
          </Table.ColHeader>

          <Table.ColHeader id='review'>   
              <Tooltip
                renderTip='Shows images with alt text that have not bee published.'
                as={Button}              
              >                 
                <span> 
                    <i class="fa-solid fa-circle-info"></i> &nbsp; Review
                </span>
              </Tooltip>
          </Table.ColHeader>

          <Table.ColHeader id='publish_course'>  
              <Tooltip
                renderTip='Publish all images with alt text from the course.'
                as={Button}              
              >                     
                <span> 
                    <i class="fa-solid fa-circle-info"></i> &nbsp;  Publish All 
                </span>
              </Tooltip>
          </Table.ColHeader>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {(courses || []).map((course, index) => {
            if(course.total_images !== course.published_images){
              // if((courseFilter === "") || (courseFilter !== "" && course.name && course.name.toLowerCase().replaceAll(" ", "").includes(courseFilter.toLowerCase().replaceAll(" ", "")))){
                if(courses.length === index + 1 && courses.length === (pageNumber * 20 + 20)){
                  return (
                    <Table.Row key={course.id}>
                      <Table.RowHeader id={course.id}><a target="_blank" href={"https://usu.instructure.com/courses/" + course.id}>{course.name}</a></Table.RowHeader>
                      <Table.Cell>{course.total_images}</Table.Cell>
                      <Table.Cell>{course.published_images}</Table.Cell>
                      <Table.Cell>{course.completed_images - course.published_images}</Table.Cell>
                      <Table.Cell>{course.advanced_images}</Table.Cell>
                      <Table.Cell>{course.available_images}</Table.Cell>
                      <Table.Cell><Button color='secondary' onClick={() => handleReview(course.id, course.name)}>Review</Button></Table.Cell>
                      <Table.Cell><Button color='secondary' onClick={() => handlePublish(course.id)}>Publish</Button></Table.Cell>
                      <Table.Cell><div ref={lastTableElement}></div></Table.Cell>
                    </Table.Row>
                  )
                }
                else {
                  return (
                    <Table.Row key={course.id}>
                      <Table.RowHeader id={course.id}><a target="_blank" href={"https://usu.instructure.com/courses/" + course.id}>{course.name}</a></Table.RowHeader>
                      <Table.Cell>{course.total_images}</Table.Cell>
                      <Table.Cell>{course.published_images}</Table.Cell>
                      <Table.Cell>{course.completed_images - course.published_images}</Table.Cell>
                      <Table.Cell>{course.advanced_images}</Table.Cell>
                      <Table.Cell>{course.available_images}</Table.Cell>
                      <Table.Cell><Button color='secondary' onClick={() => handleReview(course.id, course.name)}>Review</Button></Table.Cell>
                      <Table.Cell><Button color='secondary' onClick={() => handlePublish(course.id)}>Publish</Button></Table.Cell>
                    </Table.Row>
                  )
                }
            }
        })}
      </Table.Body>
    </Table>
  );
}
