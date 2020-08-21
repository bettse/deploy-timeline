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

  render() {
    const { site } = this.props
    const { deploys, gif, selectedScreenshot } = this.state
    const { name } = site
    //{id, site_id, plan, ssl_plan, premium, claimed, name, custom_domain, domain_aliases, password, notification_email, url, admin_url, deploy_id, build_id, deploy_url, state, screenshot_url, created_at, updated_at, user_id, error_message, ssl, ssl_url, force_ssl, ssl_status, max_domain_aliases, build_settings, processing_settings, prerender, prerender_headers, deploy_hook, published_deploy, managed_dns, jwt_secret, jwt_roles_path, account_slug, account_name, account_type, capabilities, paid_individual_site_subscription, dns_zone_id, identity_instance_id, use_functions, parent_user_id, automatic_tls_provisioning, disabled, lifecycle_state, id_domain, use_lm, build_image, automatic_tls_provisioning_expired, analytics_instance_id, functions_region, functions_config, plugins}

    if (!deploys || deploys.length === 0) {
      return (
        <Spinner animation="grow" variant="primary" />
      );
    }
    const screenshots = deploys.map(d => d.screenshot_url).filter(url => url)

    return (
      <Container>
        <Row>
          <Col>
            <h1>{name}</h1>
           </Col>
        </Row>
        <Row className="justify-content-center">
          <Col xs="auto" sm="auto" md="auto" lg="auto" xl="auto">
            <Carousel
              fade
              indicators={false}
              interval={null}
              keyboard={false}
              slide={false}
              touch={false}
              wrap={false}
              activeIndex={selectedScreenshot}
            >
            {screenshots.map((url, i) => {
              return (
              <Carousel.Item key={i}>
                <Image src={url} fluid rounded alt="Screenshot" />
              </Carousel.Item>
              )
            })}
            </Carousel>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col xs="auto" sm="auto" md="auto" lg="auto" xl="auto">
            <Form>
              <Form.Group controlId="timeline">
                <Form.Control type="range" onChange={this.timelineChange} value={selectedScreenshot} min={0} max={screenshots.length} step={1} size="lg"/>
              </Form.Group>
            </Form>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col xs="auto" sm="auto" md="auto" lg="auto" xl="auto">
            <If condition={gif === null}>
              <Then>
                <Spinner animation="grow" variant="secondary" />
                Building Gif
                <Spinner animation="grow" variant="secondary" />
              </Then>
              <Else>
                <Image src={gif} fluid rounded alt="Animation of screenshots" />
              </Else>
            </If>
          </Col>
        </Row>
      </Container>
    );
  }
}
