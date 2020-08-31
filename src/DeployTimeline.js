import React, { Component } from 'react'
import NetlifyAPI from 'netlify'

import gifshot from 'gifshot'
import { If, Then, Else } from 'react-if'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Carousel from 'react-bootstrap/Carousel'
import Spinner from 'react-bootstrap/Spinner'
import Image from 'react-bootstrap/Image'
import Form from 'react-bootstrap/Form'
import Card from 'react-bootstrap/Card'
import ProgressBar from 'react-bootstrap/ProgressBar'

const DECIMAL = 10;

const parseDecimal = (str) => parseInt(str, DECIMAL)

export default class DeployTimeline extends Component {
  constructor(props, context) {
    super(props, context)
    const { site } = props
    const { site_id } = site

    const deploys = JSON.parse(localStorage.getItem(`${site_id}-deploys`) || '[]')

    this.state = {
      deploys,
      gif: null,
      progress: 0,
      selectedScreenshot: 0,
    }
  }

  async componentDidMount() {
    const { site, user } = this.props
    const { site_id } = site

    const client = new NetlifyAPI(window.atob(user.token))
    const results = await client.listSiteDeploys({
      site_id,
    });
    const deploys = results.sort((a, b) => new Date(a.published_at) - new Date(b.published_at))
    const images = deploys.map(d => d.screenshot_url).filter(url => url)

    const gifOptions = {
      progressCallback: (progress) => this.setState({progress}),
      gifWidth: 900,
      gifHeight: 600,
      frameDuration: 2,
      images
    }
    gifshot.createGIF(gifOptions, (obj) => {
      const { error, image } = obj
      if (error) {
        console.log('gifshot error', obj.error)
        return;
      }

      this.setState({gif: image})
    });

    localStorage.setItem(`${site_id}-deploys`, JSON.stringify(deploys))
    this.setState({deploys})
  }

  timelineChange = (event) => {
    const { target } = event;
    const { value } = target
    this.setState({selectedScreenshot: parseDecimal(value)})
  }

  carouselSelect = (value) => {
    this.setState({selectedScreenshot: parseDecimal(value)})
  }

  render() {
    const { site } = this.props
    const { deploys, gif, progress, selectedScreenshot } = this.state
    const { name } = site

    if (!deploys || deploys.length === 0) {
      return (
        <Spinner animation="grow" variant="primary" />
      );
    }
    const screenshots = deploys.map(d => d.screenshot_url).filter(url => url)

    const arrowStyle = {
      backgroundColor: 'black',
      borderRadius: '50%',
      border: '1px solid black',
    }

    return (
      <Container>
        <Row>
          <Col>
            <h1>{name}</h1>
           </Col>
        </Row>
        <Row className="justify-content-center">
          <Col xs="auto" sm="auto" md="auto" lg="auto" xl="auto">
            <Card border="primary" bg="light" className="text-center" >
              <Card.Body>
                <Carousel
                  fade
                  indicators={false}
                  interval={null}
                  slide={false}
                  wrap={false}
                  activeIndex={selectedScreenshot}
                  onSelect={this.carouselSelect}
                  prevIcon={<span aria-hidden="true" className="carousel-control-prev-icon" style={arrowStyle} />}
                  nextIcon={<span aria-hidden="true" className="carousel-control-next-icon" style={arrowStyle} />}
                >
                {screenshots.map((url, i) => {
                  return (
                  <Carousel.Item key={i}>
                    <Card.Img src={url} alt="Screenshot" />
                  </Carousel.Item>
                  )
                })}
                </Carousel>
              </Card.Body>
            <Card.Footer>
              <Form className="w-100">
                <Form.Group controlId="timeline" className="w-100">
                  <Form.Control type="range" onChange={this.timelineChange} value={selectedScreenshot} min={0} max={screenshots.length - 1} step={1} size="lg"/>
                </Form.Group>
              </Form>
            </Card.Footer>
            </Card>
          </Col>
        </Row>
        <Row className="justify-content-center text-center pt-3" style={{width: '100%'}} >
          <Col xs="auto" sm="auto" md="auto" lg="auto" xl="auto" style={{width: '100%'}} >
            <If condition={progress < 1}>
              <Then>
                Building Gif
                <ProgressBar min={0} max={1} now={progress} striped variant="success" style={{width: '100%'}} />
              </Then>
              <Else>
                <Image width={300} height={200} src={gif} fluid rounded alt="Animation of screenshots" />
              </Else>
            </If>
          </Col>
        </Row>
      </Container>
    );
  }
}
