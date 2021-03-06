import React from 'react';
import PropTypes from 'prop-types';

import { format, formatDistanceStrict } from 'date-fns';

import Button from 'react-bootstrap/es/Button';
import Tooltip from 'react-bootstrap/es/Tooltip';
import OverlayTrigger from 'react-bootstrap/es/OverlayTrigger';
import Collapse from 'react-bootstrap/es/Collapse';

import AppContainer from '../../services/AppContainer';
import PageContainer from '../../services/PageContainer';

import { createSubscribedElement } from '../UnstatedUtils';
import RevisionBody from '../Page/RevisionBody';
import UserPicture from '../User/UserPicture';
import Username from '../User/Username';
import CommentEditor from './CommentEditor';

/**
 *
 * @author Yuki Takei <yuki@weseek.co.jp>
 *
 * @export
 * @class Comment
 * @extends {React.Component}
 */
class Comment extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      html: '',
      isOlderRepliesShown: false,
      showReEditorIds: new Set(),
    };

    this.growiRenderer = this.props.appContainer.getRenderer('comment');

    this.isCurrentUserIsAuthor = this.isCurrentUserEqualsToAuthor.bind(this);
    this.isCurrentRevision = this.isCurrentRevision.bind(this);
    this.getRootClassName = this.getRootClassName.bind(this);
    this.getRevisionLabelClassName = this.getRevisionLabelClassName.bind(this);
    this.deleteBtnClickedHandler = this.deleteBtnClickedHandler.bind(this);
    this.renderText = this.renderText.bind(this);
    this.renderHtml = this.renderHtml.bind(this);
    this.commentButtonClickedHandler = this.commentButtonClickedHandler.bind(this);
  }

  componentWillMount() {
    this.renderHtml(this.props.comment.comment);
  }

  componentWillReceiveProps(nextProps) {
    this.renderHtml(nextProps.comment.comment);
  }

  // not used
  setMarkdown(markdown) {
    this.renderHtml(markdown);
  }

  checkPermissionToControlComment() {
    return this.props.appContainer.isAdmin || this.isCurrentUserEqualsToAuthor();
  }

  isCurrentUserEqualsToAuthor() {
    return this.props.comment.creator.username === this.props.appContainer.me;
  }

  isCurrentRevision() {
    return this.props.comment.revision === this.props.pageContainer.state.revisionId;
  }

  getRootClassName(comment) {
    let className = 'page-comment';

    const { revisionId, revisionCreatedAt } = this.props.pageContainer.state;
    if (comment.revision === revisionId) {
      className += ' page-comment-current';
    }
    else if (Date.parse(comment.createdAt) / 1000 > revisionCreatedAt) {
      className += ' page-comment-newer';
    }
    else {
      className += ' page-comment-older';
    }

    if (this.isCurrentUserEqualsToAuthor()) {
      className += ' page-comment-me';
    }

    return className;
  }

  getRevisionLabelClassName() {
    return `page-comment-revision label ${
      this.isCurrentRevision() ? 'label-primary' : 'label-default'}`;
  }

  editBtnClickedHandler(commentId) {
    const ids = this.state.showReEditorIds.add(commentId);
    this.setState({ showReEditorIds: ids });
  }

  commentButtonClickedHandler(commentId) {
    this.setState((prevState) => {
      prevState.showReEditorIds.delete(commentId);
      return {
        showReEditorIds: prevState.showReEditorIds,
      };
    });
  }

  deleteBtnClickedHandler() {
    this.props.deleteBtnClicked(this.props.comment);
  }

  renderText(comment) {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{comment}</span>;
  }

  renderRevisionBody() {
    const config = this.props.appContainer.getConfig();
    const isMathJaxEnabled = !!config.env.MATHJAX;
    return (
      <RevisionBody
        html={this.state.html}
        isMathJaxEnabled={isMathJaxEnabled}
        renderMathJaxOnInit
        additionalClassName="comment"
      />
    );
  }

  toggleOlderReplies() {
    this.setState((prevState) => {
      return {
        showOlderReplies: !prevState.showOlderReplies,
      };
    });
  }

  renderHtml(markdown) {
    const context = {
      markdown,
    };

    const growiRenderer = this.props.growiRenderer;
    const interceptorManager = this.props.appContainer.interceptorManager;
    interceptorManager.process('preRenderComment', context)
      .then(() => { return interceptorManager.process('prePreProcess', context) })
      .then(() => {
        context.markdown = growiRenderer.preProcess(context.markdown);
      })
      .then(() => { return interceptorManager.process('postPreProcess', context) })
      .then(() => {
        const parsedHTML = growiRenderer.process(context.markdown);
        context.parsedHTML = parsedHTML;
      })
      .then(() => { return interceptorManager.process('prePostProcess', context) })
      .then(() => {
        context.parsedHTML = growiRenderer.postProcess(context.parsedHTML);
      })
      .then(() => { return interceptorManager.process('postPostProcess', context) })
      .then(() => { return interceptorManager.process('preRenderCommentHtml', context) })
      .then(() => {
        this.setState({ html: context.parsedHTML });
      })
      // process interceptors for post rendering
      .then(() => { return interceptorManager.process('postRenderCommentHtml', context) });

  }

  renderReply(reply) {
    return (
      <div key={reply._id} className="page-comment-reply">
        <CommentWrapper
          comment={reply}
          deleteBtnClicked={this.props.deleteBtnClicked}
          growiRenderer={this.props.growiRenderer}
        />
      </div>
    );
  }

  renderReplies() {
    const layoutType = this.props.appContainer.getConfig().layoutType;
    const isBaloonStyle = layoutType.match(/crowi-plus|growi|kibela/);

    let replyList = this.props.replyList;
    if (!isBaloonStyle) {
      replyList = replyList.slice().reverse();
    }

    const areThereHiddenReplies = replyList.length > 2;

    const { isOlderRepliesShown } = this.state;
    const toggleButtonIconName = isOlderRepliesShown ? 'icon-arrow-up' : 'icon-options-vertical';
    const toggleButtonIcon = <i className={`icon-fw ${toggleButtonIconName}`}></i>;
    const toggleButtonLabel = isOlderRepliesShown ? '' : 'more';
    const toggleButton = (
      <Button
        bsStyle="link"
        className="page-comments-list-toggle-older"
        onClick={() => { this.setState({ isOlderRepliesShown: !isOlderRepliesShown }) }}
      >
        {toggleButtonIcon} {toggleButtonLabel}
      </Button>
    );

    const shownReplies = replyList.slice(replyList.length - 2, replyList.length);
    const hiddenReplies = replyList.slice(0, replyList.length - 2);

    const hiddenElements = hiddenReplies.map((reply) => {
      return this.renderReply(reply);
    });

    const shownElements = shownReplies.map((reply) => {
      return this.renderReply(reply);
    });

    return (
      <React.Fragment>
        { areThereHiddenReplies && (
          <div className="page-comments-hidden-replies">
            <Collapse in={this.state.isOlderRepliesShown}>
              <div>{hiddenElements}</div>
            </Collapse>
            <div className="text-center">{toggleButton}</div>
          </div>
        ) }

        {shownElements}
      </React.Fragment>
    );
  }

  renderCommentControl(comment) {
    return (
      <div className="page-comment-control">
        <button type="button" className="btn btn-link p-2" onClick={() => { this.editBtnClickedHandler(comment._id) }}>
          <i className="ti-pencil"></i>
        </button>
        <button type="button" className="btn btn-link p-2 mr-2" onClick={this.deleteBtnClickedHandler}>
          <i className="ti-close"></i>
        </button>
      </div>
    );
  }

  render() {
    const comment = this.props.comment;
    const commentId = comment._id;
    const creator = comment.creator;
    const isMarkdown = comment.isMarkdown;
    const createdAt = new Date(comment.createdAt);
    const updatedAt = new Date(comment.updatedAt);
    const isEdited = createdAt < updatedAt;

    const showReEditor = this.state.showReEditorIds.has(commentId);

    const rootClassName = this.getRootClassName(comment);
    const commentDate = formatDistanceStrict(createdAt, new Date());
    const commentBody = isMarkdown ? this.renderRevisionBody() : this.renderText(comment.comment);
    const revHref = `?revision=${comment.revision}`;
    const revFirst8Letters = comment.revision.substr(-8);
    const revisionLavelClassName = this.getRevisionLabelClassName();

    const commentDateTooltip = (
      <Tooltip id={`commentDateTooltip-${comment._id}`}>
        {format(createdAt, 'yyyy/MM/dd HH:mm')}
      </Tooltip>
    );
    const editedDateTooltip = isEdited
      ? (
        <Tooltip id={`editedDateTooltip-${comment._id}`}>
          {format(updatedAt, 'yyyy/MM/dd HH:mm')}
        </Tooltip>
      )
      : null;

    return (
      <React.Fragment>

        {showReEditor ? (
          <CommentEditor
            growiRenderer={this.growiRenderer}
            currentCommentId={commentId}
            commentBody={comment.comment}
            replyTo={undefined}
            commentButtonClickedHandler={this.commentButtonClickedHandler}
            commentCreator={creator.username}
          />
        ) : (
          <div className={rootClassName}>
            <UserPicture user={creator} />
            <div className="page-comment-main">
              <div className="page-comment-creator">
                <Username user={creator} />
              </div>
              <div className="page-comment-body">{commentBody}</div>
              <div className="page-comment-meta">
                <OverlayTrigger overlay={commentDateTooltip} placement="bottom">
                  <span>{commentDate}</span>
                </OverlayTrigger>
                { isEdited && (
                  <OverlayTrigger overlay={editedDateTooltip} placement="bottom">
                    <span>&nbsp;(edited)</span>
                  </OverlayTrigger>
                ) }
                <span className="ml-2"><a className={revisionLavelClassName} href={revHref}>{revFirst8Letters}</a></span>
              </div>
              { this.checkPermissionToControlComment() && this.renderCommentControl(comment) }
            </div>
          </div>
        )
      }
        {this.renderReplies()}

      </React.Fragment>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const CommentWrapper = (props) => {
  return createSubscribedElement(Comment, props, [AppContainer, PageContainer]);
};

Comment.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  pageContainer: PropTypes.instanceOf(PageContainer).isRequired,

  comment: PropTypes.object.isRequired,
  growiRenderer: PropTypes.object.isRequired,
  deleteBtnClicked: PropTypes.func.isRequired,
  replyList: PropTypes.array,
};
Comment.defaultProps = {
  replyList: [],
};

export default CommentWrapper;
