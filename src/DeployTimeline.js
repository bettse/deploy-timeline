import React, { Component } from 'react'
import NetlifyAPI from 'netlify'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Carousel from 'react-bootstrap/Carousel'
import Spinner from 'react-bootstrap/Spinner'


import missing from './assets/missing.png'

export default class DeployTimeline extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      deploys: null,
    }
  }

  async componentDidMount() {
    const { site, user } = this.props
    const { site_id } = site

    const client = new NetlifyAPI(window.atob(user.token))
    const deploys = await client.listSiteDeploys({
      site_id,
    })

    this.setState({deploys})
  }


  render() {
    const { site } = this.props
    const { deploys } = this.state
    const { name } = site
    //{id, site_id, plan, ssl_plan, premium, claimed, name, custom_domain, domain_aliases, password, notification_email, url, admin_url, deploy_id, build_id, deploy_url, state, screenshot_url, created_at, updated_at, user_id, error_message, ssl, ssl_url, force_ssl, ssl_status, max_domain_aliases, build_settings, processing_settings, prerender, prerender_headers, deploy_hook, published_deploy, managed_dns, jwt_secret, jwt_roles_path, account_slug, account_name, account_type, capabilities, paid_individual_site_subscription, dns_zone_id, identity_instance_id, use_functions, parent_user_id, automatic_tls_provisioning, disabled, lifecycle_state, id_domain, use_lm, build_image, automatic_tls_provisioning_expired, analytics_instance_id, functions_region, functions_config, plugins}

    if (!deploys) {
      return (
        <Spinner animation="grow" variant="primary" />
      );
    }

    let prevScreenshot = missing;
    const fixSS = deploy => {
      const { screenshot_url } = deploy;
      if (screenshot_url) {
        prevScreenshot = screenshot_url;
        return deploy;
      } else {
        return {...deploy, screenshot_url: prevScreenshot}
      }
    }

    return (
      <Container>
        <Row>
          <Col>
            <h1>{name}</h1>
            <Carousel>
            {deploys.map(fixSS).map((deploy, i) => {
              const { screenshot_url, published_at, summary  } = deploy
              const { messages } = summary;
              return (
              <Carousel.Item key={i}>
                <img className="d-block w-100" src={screenshot_url} alt="Screenshot" />

                <Carousel.Caption>
                  <h3>{published_at}</h3>
                  {messages.map((message, i) => {
                    const { title } = message
                    return (<p key={i}>{title}</p>)
                  })}
                </Carousel.Caption>
              </Carousel.Item>
              )
            })}
            </Carousel>
          </Col>
        </Row>
      </Container>
    );
  }
}
